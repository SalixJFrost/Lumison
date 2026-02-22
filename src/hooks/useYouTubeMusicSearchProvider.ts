/**
 * YouTube Music Search Provider Hook
 */

import { useState, useCallback } from 'react';
import { SearchProvider, SearchResultItem } from './useSearchProvider';
import { getYouTubeMusicService, YouTubeMusicTrack } from '../services/streaming/youtube/YouTubeMusicService';
import { Song } from '../types';

// YouTube API Key - should be configured in environment or settings
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || '';

export interface YouTubeMusicSearchResult extends Song {
  youtubeId: string;
  viewCount?: number;
  channelTitle: string;
}

export function useYouTubeMusicSearchProvider(): SearchProvider {
  const [results, setResults] = useState<YouTubeMusicSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [lastQuery, setLastQuery] = useState('');

  const convertToSong = useCallback((track: YouTubeMusicTrack): YouTubeMusicSearchResult => {
    return {
      id: `youtube-${track.id}`,
      youtubeId: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album,
      coverUrl: track.coverUrl,
      fileUrl: `https://www.youtube.com/watch?v=${track.id}`,
      lyrics: [],
      duration: track.duration,
      viewCount: track.viewCount,
      channelTitle: track.channelTitle,
      isYouTube: true,
      needsLyricsMatch: true,
    };
  }, []);

  const search = useCallback(async (query: string): Promise<SearchResultItem[]> => {
    if (!query.trim()) {
      setResults([]);
      setHasMore(false);
      setNextPageToken(undefined);
      return [];
    }

    setIsLoading(true);
    setLastQuery(query);

    try {
      const service = getYouTubeMusicService(YOUTUBE_API_KEY);
      const response = await service.search(query, { limit: 20 });

      const songs = response.tracks.map(convertToSong);
      setResults(songs);
      setHasMore(!!response.nextPageToken);
      setNextPageToken(response.nextPageToken);

      return songs;
    } catch (error) {
      console.error('YouTube Music search failed:', error);
      setResults([]);
      setHasMore(false);
      setNextPageToken(undefined);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [convertToSong]);

  const loadMore = useCallback(async (query: string, offset: number, limit: number): Promise<SearchResultItem[]> => {
    if (!nextPageToken || isLoading) {
      return [];
    }

    setIsLoading(true);

    try {
      const service = getYouTubeMusicService(YOUTUBE_API_KEY);
      const response = await service.search(query, {
        limit,
        pageToken: nextPageToken,
      });

      const newSongs = response.tracks.map(convertToSong);
      const updatedResults = [...results, ...newSongs];
      
      setResults(updatedResults);
      setHasMore(!!response.nextPageToken);
      setNextPageToken(response.nextPageToken);

      return newSongs;
    } catch (error) {
      console.error('YouTube Music load more failed:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [nextPageToken, isLoading, results, convertToSong]);

  return {
    id: 'youtube-music',
    label: 'YouTube Music',
    requiresExplicitSearch: true,
    search,
    loadMore,
    hasMore,
    isLoading,
  };
}
