/**
 * Streaming Configuration
 * Centralized configuration for audio streaming features
 */

export interface StreamingConfig {
  // Enable streaming playback (MediaSource API)
  enableStreaming: boolean;
  
  // Chunk size for streaming (bytes)
  chunkSize: number;
  
  // Maximum cache size (bytes)
  maxCacheSize: number;
  
  // Prefetch size (bytes)
  prefetchSize: number;
  
  // Enable progressive loading fallback
  enableProgressiveFallback: boolean;
  
  // Timeout for streaming initialization (ms)
  streamingTimeout: number;
  
  // Enable detailed logging
  enableLogging: boolean;
}

/**
 * Default streaming configuration
 */
export const DEFAULT_STREAMING_CONFIG: StreamingConfig = {
  enableStreaming: true,
  chunkSize: 256 * 1024, // 256KB
  maxCacheSize: 10 * 1024 * 1024, // 10MB
  prefetchSize: 1024 * 1024, // 1MB
  enableProgressiveFallback: true,
  streamingTimeout: 10000, // 10 seconds
  enableLogging: false,
};

/**
 * Production streaming configuration
 * Optimized for production environment
 */
export const PRODUCTION_STREAMING_CONFIG: StreamingConfig = {
  enableStreaming: true,
  chunkSize: 512 * 1024, // 512KB (larger chunks for better performance)
  maxCacheSize: 20 * 1024 * 1024, // 20MB
  prefetchSize: 2 * 1024 * 1024, // 2MB
  enableProgressiveFallback: true,
  streamingTimeout: 15000, // 15 seconds
  enableLogging: false,
};

/**
 * Development streaming configuration
 * Includes detailed logging
 */
export const DEVELOPMENT_STREAMING_CONFIG: StreamingConfig = {
  enableStreaming: true,
  chunkSize: 128 * 1024, // 128KB (smaller for testing)
  maxCacheSize: 5 * 1024 * 1024, // 5MB
  prefetchSize: 512 * 1024, // 512KB
  enableProgressiveFallback: true,
  streamingTimeout: 10000,
  enableLogging: true,
};

/**
 * Get streaming configuration based on environment
 */
export function getStreamingConfig(): StreamingConfig {
  const isDevelopment = import.meta.env.DEV;
  return isDevelopment ? DEVELOPMENT_STREAMING_CONFIG : PRODUCTION_STREAMING_CONFIG;
}

/**
 * File size thresholds for streaming decisions
 */
export const FILE_SIZE_THRESHOLDS = {
  // Use streaming for files larger than 5MB
  STREAMING_THRESHOLD: 5 * 1024 * 1024,
  
  // Use progressive loading for files smaller than 5MB
  PROGRESSIVE_THRESHOLD: 5 * 1024 * 1024,
  
  // Warn user for files larger than 50MB
  LARGE_FILE_WARNING: 50 * 1024 * 1024,
};

/**
 * Supported audio formats for streaming
 */
export const SUPPORTED_STREAMING_FORMATS = [
  'audio/mpeg',
  'audio/mp4',
  'audio/webm',
  'audio/ogg',
];

/**
 * Check if format supports streaming
 */
export function isFormatStreamable(mimeType: string): boolean {
  return SUPPORTED_STREAMING_FORMATS.some(format => 
    mimeType.toLowerCase().includes(format)
  );
}
