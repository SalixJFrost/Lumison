/**
 * Cover Art Service
 * Fetches album cover art from multiple sources
 */

export interface CoverArtResult {
  url: string;
  source: 'coverartarchive' | 'itunes' | 'fallback';
  width?: number;
  height?: number;
}

/**
 * Fetch cover art from Cover Art Archive using MusicBrainz ID
 */
export async function fetchCoverArtFromMusicBrainz(
  mbid: string
): Promise<CoverArtResult | null> {
  try {
    const response = await fetch(
      `https://coverartarchive.org/release/${mbid}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    // Get front cover or first available image
    const frontCover = data.images?.find((img: any) => 
      img.front === true || img.types?.includes('Front')
    );
    
    const image = frontCover || data.images?.[0];
    
    if (!image) {
      return null;
    }

    // Prefer large thumbnail, fallback to original
    const url = image.thumbnails?.large || image.thumbnails?.small || image.image;

    return {
      url,
      source: 'coverartarchive',
      width: image.thumbnails?.large ? 500 : undefined,
      height: image.thumbnails?.large ? 500 : undefined,
    };
  } catch (error) {
    console.error('Cover Art Archive fetch error:', error);
    return null;
  }
}

/**
 * Fetch cover art from iTunes Search API
 */
export async function fetchCoverArtFromItunes(
  artist: string,
  album?: string,
  track?: string
): Promise<CoverArtResult | null> {
  try {
    // Build search term
    let searchTerm = artist;
    if (album) {
      searchTerm += ` ${album}`;
    } else if (track) {
      searchTerm += ` ${track}`;
    }

    const params = new URLSearchParams({
      term: searchTerm,
      media: 'music',
      entity: album ? 'album' : 'song',
      limit: '1',
    });

    const response = await fetch(
      `https://itunes.apple.com/search?${params.toString()}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return null;
    }

    const result = data.results[0];
    let artworkUrl = result.artworkUrl100 || result.artworkUrl60;

    if (!artworkUrl) {
      return null;
    }

    // Upgrade to higher resolution (iTunes supports up to 1200x1200)
    artworkUrl = artworkUrl
      .replace('100x100', '600x600')
      .replace('60x60', '600x600');

    return {
      url: artworkUrl,
      source: 'itunes',
      width: 600,
      height: 600,
    };
  } catch (error) {
    console.error('iTunes Search API fetch error:', error);
    return null;
  }
}

/**
 * Search for cover art using multiple sources
 * Tries sources in order: MusicBrainz (if MBID provided), iTunes
 */
export async function searchCoverArt(params: {
  artist: string;
  album?: string;
  track?: string;
  mbid?: string;
}): Promise<CoverArtResult | null> {
  const { artist, album, track, mbid } = params;

  // Try MusicBrainz first if MBID is provided
  if (mbid) {
    const mbResult = await fetchCoverArtFromMusicBrainz(mbid);
    if (mbResult) {
      return mbResult;
    }
  }

  // Try iTunes Search API
  const itunesResult = await fetchCoverArtFromItunes(artist, album, track);
  if (itunesResult) {
    return itunesResult;
  }

  return null;
}

/**
 * Get cover art URL with fallback
 */
export async function getCoverArtUrl(params: {
  artist: string;
  album?: string;
  track?: string;
  mbid?: string;
  fallbackUrl?: string;
}): Promise<string | undefined> {
  const result = await searchCoverArt(params);
  
  if (result) {
    return result.url;
  }

  return params.fallbackUrl;
}

/**
 * Batch fetch cover art for multiple tracks
 */
export async function batchFetchCoverArt(
  tracks: Array<{
    id: string;
    artist: string;
    album?: string;
    track?: string;
    mbid?: string;
  }>
): Promise<Map<string, CoverArtResult>> {
  const results = new Map<string, CoverArtResult>();

  // Process in batches to avoid rate limiting
  const batchSize = 5;
  for (let i = 0; i < tracks.length; i += batchSize) {
    const batch = tracks.slice(i, i + batchSize);
    
    const promises = batch.map(async (track) => {
      const result = await searchCoverArt(track);
      if (result) {
        results.set(track.id, result);
      }
    });

    await Promise.all(promises);
    
    // Add delay between batches to respect rate limits
    if (i + batchSize < tracks.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * Cache for cover art URLs to avoid repeated API calls
 * Optimized for memory efficiency
 */
class CoverArtCache {
  private cache = new Map<string, CoverArtResult>();
  private accessOrder = new Map<string, number>(); // Track access time for LRU
  private maxSize: number;
  private maxMemoryMB: number;
  private currentMemoryMB = 0;

  constructor() {
    // Optimize cache size based on device memory
    const deviceMemory = (navigator as any).deviceMemory || 4;
    if (deviceMemory < 4) {
      this.maxSize = 20; // Low-end: 20 entries
      this.maxMemoryMB = 5; // 5MB limit
    } else if (deviceMemory < 8) {
      this.maxSize = 50; // Mid-range: 50 entries
      this.maxMemoryMB = 10; // 10MB limit
    } else {
      this.maxSize = 100; // High-end: 100 entries
      this.maxMemoryMB = 20; // 20MB limit
    }
  }

  private getCacheKey(params: {
    artist: string;
    album?: string;
    track?: string;
    mbid?: string;
  }): string {
    const { artist, album, track, mbid } = params;
    if (mbid) return `mbid:${mbid}`;
    if (album) return `${artist}:${album}`.toLowerCase();
    if (track) return `${artist}:${track}`.toLowerCase();
    return artist.toLowerCase();
  }

  private estimateMemoryUsage(result: CoverArtResult): number {
    // Estimate memory usage in MB
    // Typical cover art URL is ~100 bytes, result object ~200 bytes
    return 0.0003; // ~0.3KB per entry
  }

  private evictLRU(): void {
    // Find and remove least recently used entry
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    for (const [key, time] of this.accessOrder.entries()) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      const result = this.cache.get(oldestKey);
      if (result) {
        this.currentMemoryMB -= this.estimateMemoryUsage(result);
      }
      this.cache.delete(oldestKey);
      this.accessOrder.delete(oldestKey);
    }
  }

  get(params: {
    artist: string;
    album?: string;
    track?: string;
    mbid?: string;
  }): CoverArtResult | null {
    const key = this.getCacheKey(params);
    const result = this.cache.get(key);
    
    if (result) {
      // Update access time for LRU
      this.accessOrder.set(key, Date.now());
    }
    
    return result || null;
  }

  set(
    params: {
      artist: string;
      album?: string;
      track?: string;
      mbid?: string;
    },
    result: CoverArtResult
  ): void {
    const key = this.getCacheKey(params);
    const memoryUsage = this.estimateMemoryUsage(result);
    
    // Evict entries if necessary
    while (
      (this.cache.size >= this.maxSize || 
       this.currentMemoryMB + memoryUsage > this.maxMemoryMB) &&
      this.cache.size > 0
    ) {
      this.evictLRU();
    }
    
    this.cache.set(key, result);
    this.accessOrder.set(key, Date.now());
    this.currentMemoryMB += memoryUsage;
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
    this.currentMemoryMB = 0;
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      memoryMB: this.currentMemoryMB.toFixed(2),
      maxMemoryMB: this.maxMemoryMB,
    };
  }
}

export const coverArtCache = new CoverArtCache();

/**
 * Search cover art with caching
 */
export async function searchCoverArtCached(params: {
  artist: string;
  album?: string;
  track?: string;
  mbid?: string;
}): Promise<CoverArtResult | null> {
  // Check cache first
  const cached = coverArtCache.get(params);
  if (cached) {
    return cached;
  }

  // Fetch from API
  const result = await searchCoverArt(params);
  
  // Cache result
  if (result) {
    coverArtCache.set(params, result);
  }

  return result;
}

/**
 * Get the default cover art image
 * Returns the path to the default cover image in the public folder
 * Handles both Tauri and web deployment paths
 */
export function getDefaultCoverArt(): string {
  // In Vite, import.meta.env.BASE_URL provides the correct base path
  const basePath = (import.meta as any).env?.BASE_URL || '/';
  return `${basePath}default-cover.png`.replace('//', '/');
}
