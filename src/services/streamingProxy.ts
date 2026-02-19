/**
 * Streaming Proxy Service for Bilibili Audio
 * Enables progressive playback without downloading entire file
 */

interface StreamingConfig {
  chunkSize: number;
  maxCacheSize: number;
  prefetchSize: number;
}

const DEFAULT_CONFIG: StreamingConfig = {
  chunkSize: 256 * 1024, // 256KB chunks
  maxCacheSize: 10 * 1024 * 1024, // 10MB max cache
  prefetchSize: 1024 * 1024, // 1MB prefetch
};

/**
 * Create a streaming blob URL that supports range requests
 * This enables progressive playback for large audio files
 */
export class StreamingAudioProxy {
  private sourceUrl: string;
  private mediaSource: MediaSource | null = null;
  private sourceBuffer: SourceBuffer | null = null;
  private objectUrl: string | null = null;
  private chunks: Map<number, ArrayBuffer> = new Map();
  private totalSize: number = 0;
  private mimeType: string = 'audio/mpeg';
  private isInitialized: boolean = false;
  private fetchController: AbortController | null = null;

  constructor(sourceUrl: string) {
    this.sourceUrl = sourceUrl;
  }

  /**
   * Initialize MediaSource for streaming
   */
  async initialize(): Promise<string> {
    if (this.objectUrl) {
      return this.objectUrl;
    }

    // Check if MediaSource is supported
    if (!window.MediaSource) {
      throw new Error('MediaSource API not supported');
    }

    // Create MediaSource
    this.mediaSource = new MediaSource();
    this.objectUrl = URL.createObjectURL(this.mediaSource);

    // Wait for MediaSource to open
    await new Promise<void>((resolve, reject) => {
      if (!this.mediaSource) {
        reject(new Error('MediaSource not initialized'));
        return;
      }

      this.mediaSource.addEventListener('sourceopen', () => {
        resolve();
      }, { once: true });

      this.mediaSource.addEventListener('error', (e) => {
        reject(new Error('MediaSource error: ' + e));
      }, { once: true });
    });

    // Get content type from source
    try {
      const response = await fetch(this.sourceUrl, {
        method: 'HEAD',
        headers: {
          'Referer': 'https://www.bilibili.com',
        },
      });

      this.mimeType = response.headers.get('content-type') || 'audio/mpeg';
      this.totalSize = parseInt(response.headers.get('content-length') || '0', 10);
    } catch (error) {
      console.warn('Failed to get content info, using defaults:', error);
    }

    // Add source buffer
    if (this.mediaSource && MediaSource.isTypeSupported(this.mimeType)) {
      this.sourceBuffer = this.mediaSource.addSourceBuffer(this.mimeType);
      this.isInitialized = true;
    } else {
      throw new Error(`Unsupported MIME type: ${this.mimeType}`);
    }

    return this.objectUrl;
  }

  /**
   * Fetch and append audio chunk
   */
  private async fetchChunk(start: number, end: number): Promise<ArrayBuffer> {
    const response = await fetch(this.sourceUrl, {
      headers: {
        'Range': `bytes=${start}-${end}`,
        'Referer': 'https://www.bilibili.com',
      },
      signal: this.fetchController?.signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch chunk: ${response.status}`);
    }

    return await response.arrayBuffer();
  }

  /**
   * Start streaming audio data
   */
  async startStreaming(onProgress?: (loaded: number, total: number) => void): Promise<void> {
    if (!this.isInitialized || !this.sourceBuffer || !this.mediaSource) {
      throw new Error('StreamingAudioProxy not initialized');
    }

    this.fetchController = new AbortController();
    const chunkSize = DEFAULT_CONFIG.chunkSize;
    let offset = 0;

    try {
      while (offset < this.totalSize) {
        const end = Math.min(offset + chunkSize - 1, this.totalSize - 1);
        const chunk = await this.fetchChunk(offset, end);

        // Wait for source buffer to be ready
        if (this.sourceBuffer.updating) {
          await new Promise<void>((resolve) => {
            this.sourceBuffer!.addEventListener('updateend', () => resolve(), { once: true });
          });
        }

        // Append chunk to source buffer
        this.sourceBuffer.appendBuffer(chunk);
        this.chunks.set(offset, chunk);

        offset = end + 1;

        // Report progress
        if (onProgress) {
          onProgress(offset, this.totalSize);
        }

        // Clean up old chunks to manage memory
        if (this.chunks.size * chunkSize > DEFAULT_CONFIG.maxCacheSize) {
          const oldestKey = this.chunks.keys().next().value;
          this.chunks.delete(oldestKey);
        }
      }

      // End of stream
      if (this.mediaSource.readyState === 'open') {
        this.mediaSource.endOfStream();
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Streaming aborted');
      } else {
        console.error('Streaming error:', error);
        throw error;
      }
    }
  }

  /**
   * Stop streaming and cleanup
   */
  stop(): void {
    if (this.fetchController) {
      this.fetchController.abort();
      this.fetchController = null;
    }

    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }

    this.chunks.clear();
    this.sourceBuffer = null;
    this.mediaSource = null;
    this.isInitialized = false;
  }

  /**
   * Get current object URL
   */
  getUrl(): string | null {
    return this.objectUrl;
  }

  /**
   * Get streaming progress
   */
  getProgress(): { loaded: number; total: number } {
    const loaded = this.chunks.size * DEFAULT_CONFIG.chunkSize;
    return { loaded, total: this.totalSize };
  }
}

/**
 * Simple fallback: Create blob URL with progressive loading
 * This is more compatible but uses more memory
 */
export async function createProgressiveBlob(
  url: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'Referer': 'https://www.bilibili.com',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch audio: ${response.status}`);
  }

  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;

  if (!response.body) {
    throw new Error('Response body is null');
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    if (value) {
      chunks.push(value);
      loaded += value.length;

      if (onProgress && total > 0) {
        onProgress(loaded, total);
      }
    }
  }

  const blob = new Blob(chunks as BlobPart[], {
    type: response.headers.get('content-type') || 'audio/mpeg',
  });

  return URL.createObjectURL(blob);
}

/**
 * Check if streaming is supported
 */
export function isStreamingSupported(): boolean {
  return !!(window.MediaSource && MediaSource.isTypeSupported('audio/mpeg'));
}

/**
 * Get best streaming method based on browser support
 */
export async function getBestStreamingMethod(
  url: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<string> {
  // Try MediaSource streaming first (better for large files)
  if (isStreamingSupported()) {
    try {
      const proxy = new StreamingAudioProxy(url);
      const objectUrl = await proxy.initialize();
      
      // Start streaming in background
      proxy.startStreaming(onProgress).catch((error) => {
        console.warn('Streaming failed, audio may not play completely:', error);
      });

      return objectUrl;
    } catch (error) {
      console.warn('MediaSource streaming failed, falling back to progressive blob:', error);
    }
  }

  // Fallback to progressive blob loading
  return createProgressiveBlob(url, onProgress);
}
