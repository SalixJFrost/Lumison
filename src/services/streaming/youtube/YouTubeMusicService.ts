/**
 * YouTube Music Search Service
 * Uses YouTube Data API v3 with music-specific filters
 */

import { StreamingTrack, StreamingPlatform } from '../types';

export interface YouTubeMusicTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  coverUrl: string;
  duration: number;
  viewCount?: number;
  channelId: string;
  channelTitle: string;
}

export class YouTubeMusicService {
  private apiKey: string = '';
  private baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor(apiKey?: string) {
    if (apiKey) {
      this.apiKey = apiKey;
    }
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Search for music on YouTube
   * Uses music category filter and optimized search parameters
   */
  async search(query: string, options: {
    limit?: number;
    pageToken?: string;
  } = {}): Promise<{
    tracks: YouTubeMusicTrack[];
    nextPageToken?: string;
    totalResults: number;
  }> {
    if (!this.apiKey) {
      throw new Error('YouTube API key not configured');
    }

    const { limit = 20, pageToken } = options;

    // Search for videos in music category
    const searchParams = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      videoCategoryId: '10', // Music category
      maxResults: limit.toString(),
      key: this.apiKey,
      order: 'relevance',
      safeSearch: 'none',
    });

    if (pageToken) {
      searchParams.append('pageToken', pageToken);
    }

    const searchResponse = await fetch(
      `${this.baseUrl}/search?${searchParams.toString()}`
    );

    if (!searchResponse.ok) {
      const error = await searchResponse.json();
      throw new Error(`YouTube search failed: ${error.error?.message || 'Unknown error'}`);
    }

    const searchData = await searchResponse.json();
    const videoIds = searchData.items.map((item: any) => item.id.videoId);

    // Get detailed video information including duration
    const tracks = await this.getVideoDetails(videoIds);

    return {
      tracks,
      nextPageToken: searchData.nextPageToken,
      totalResults: searchData.pageInfo?.totalResults || 0,
    };
  }

  /**
   * Get detailed information for multiple videos
   */
  private async getVideoDetails(videoIds: string[]): Promise<YouTubeMusicTrack[]> {
    if (videoIds.length === 0) return [];

    const detailsParams = new URLSearchParams({
      part: 'snippet,contentDetails,statistics',
      id: videoIds.join(','),
      key: this.apiKey,
    });

    const detailsResponse = await fetch(
      `${this.baseUrl}/videos?${detailsParams.toString()}`
    );

    if (!detailsResponse.ok) {
      throw new Error('Failed to fetch video details');
    }

    const detailsData = await detailsResponse.json();

    return detailsData.items.map((item: any) => this.parseVideoItem(item));
  }

  /**
   * Parse YouTube video item to YouTubeMusicTrack
   */
  private parseVideoItem(item: any): YouTubeMusicTrack {
    const snippet = item.snippet;
    const contentDetails = item.contentDetails;
    const statistics = item.statistics;

    // Parse title to extract artist and song name
    const { title, artist } = this.parseTitle(snippet.title);

    // Parse ISO 8601 duration to seconds
    const duration = this.parseDuration(contentDetails.duration);

    return {
      id: item.id,
      title,
      artist: artist || snippet.channelTitle,
      album: undefined,
      coverUrl: this.getBestThumbnail(snippet.thumbnails),
      duration,
      viewCount: parseInt(statistics?.viewCount || '0'),
      channelId: snippet.channelId,
      channelTitle: snippet.channelTitle,
    };
  }

  /**
   * Parse video title to extract artist and song name
   * Common formats:
   * - "Artist - Song Title"
   * - "Artist - Song Title (Official Video)"
   * - "Song Title - Artist"
   */
  private parseTitle(fullTitle: string): { title: string; artist: string | null } {
    // Remove common suffixes
    let cleanTitle = fullTitle
      .replace(/\s*\(Official\s+(Video|Audio|Music\s+Video|Lyric\s+Video)\)/gi, '')
      .replace(/\s*\[Official\s+(Video|Audio|Music\s+Video|Lyric\s+Video)\]/gi, '')
      .replace(/\s*-\s*(Official\s+)?(Video|Audio|Music\s+Video|Lyric\s+Video)/gi, '')
      .trim();

    // Try to split by common separators
    const separators = [' - ', ' – ', ' — ', ' | '];
    
    for (const separator of separators) {
      if (cleanTitle.includes(separator)) {
        const parts = cleanTitle.split(separator);
        if (parts.length >= 2) {
          // Assume format is "Artist - Title" or "Title - Artist"
          // Usually artist comes first
          return {
            artist: parts[0].trim(),
            title: parts.slice(1).join(separator).trim(),
          };
        }
      }
    }

    // If no separator found, return full title
    return {
      title: cleanTitle,
      artist: null,
    };
  }

  /**
   * Parse ISO 8601 duration to seconds
   * Format: PT#H#M#S (e.g., PT4M13S = 4 minutes 13 seconds)
   */
  private parseDuration(isoDuration: string): number {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * Get the best quality thumbnail
   */
  private getBestThumbnail(thumbnails: any): string {
    if (thumbnails.maxres) return thumbnails.maxres.url;
    if (thumbnails.high) return thumbnails.high.url;
    if (thumbnails.medium) return thumbnails.medium.url;
    if (thumbnails.default) return thumbnails.default.url;
    return '';
  }

  /**
   * Convert YouTubeMusicTrack to StreamingTrack
   */
  toStreamingTrack(track: YouTubeMusicTrack): StreamingTrack {
    return {
      id: track.id,
      platform: StreamingPlatform.YOUTUBE,
      title: track.title,
      artist: track.artist,
      album: track.album,
      coverUrl: track.coverUrl,
      duration: track.duration,
      uri: `https://www.youtube.com/watch?v=${track.id}`,
      url: `https://www.youtube.com/watch?v=${track.id}`,
    };
  }

  /**
   * Get related music videos
   */
  async getRelated(videoId: string, limit: number = 10): Promise<YouTubeMusicTrack[]> {
    if (!this.apiKey) {
      throw new Error('YouTube API key not configured');
    }

    const params = new URLSearchParams({
      part: 'snippet',
      relatedToVideoId: videoId,
      type: 'video',
      videoCategoryId: '10',
      maxResults: limit.toString(),
      key: this.apiKey,
    });

    const response = await fetch(`${this.baseUrl}/search?${params.toString()}`);

    if (!response.ok) {
      throw new Error('Failed to fetch related videos');
    }

    const data = await response.json();
    const videoIds = data.items.map((item: any) => item.id.videoId);

    return this.getVideoDetails(videoIds);
  }

  /**
   * Get trending music videos
   */
  async getTrending(options: {
    limit?: number;
    regionCode?: string;
  } = {}): Promise<YouTubeMusicTrack[]> {
    if (!this.apiKey) {
      throw new Error('YouTube API key not configured');
    }

    const { limit = 20, regionCode = 'US' } = options;

    const params = new URLSearchParams({
      part: 'snippet,contentDetails,statistics',
      chart: 'mostPopular',
      videoCategoryId: '10',
      maxResults: limit.toString(),
      regionCode,
      key: this.apiKey,
    });

    const response = await fetch(`${this.baseUrl}/videos?${params.toString()}`);

    if (!response.ok) {
      throw new Error('Failed to fetch trending videos');
    }

    const data = await response.json();

    return data.items.map((item: any) => this.parseVideoItem(item));
  }
}

// Singleton instance
let youtubeMusicServiceInstance: YouTubeMusicService | null = null;

export function getYouTubeMusicService(apiKey?: string): YouTubeMusicService {
  if (!youtubeMusicServiceInstance) {
    youtubeMusicServiceInstance = new YouTubeMusicService(apiKey);
  } else if (apiKey) {
    youtubeMusicServiceInstance.setApiKey(apiKey);
  }
  return youtubeMusicServiceInstance;
}
