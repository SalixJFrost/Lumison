/**
 * Hook for searching Internet Archive audio content
 */

import { useState, useCallback } from 'react';
import {
  searchArchive,
  fetchArchiveMetadata,
  getBestAudioFile,
  type ArchiveItem,
  type ArchiveMetadata
} from '../services/streaming/archive';
import { StreamingTrack, StreamingPlatform } from '../services/streaming/types';

export interface UseInternetArchiveSearchResult {
  results: StreamingTrack[];
  isLoading: boolean;
  error: string | null;
  search: (query: string, options?: { collection?: string; limit?: number }) => Promise<void>;
  clear: () => void;
}

export function useInternetArchiveSearch(): UseInternetArchiveSearchResult {
  const [results, setResults] = useState<StreamingTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (
    query: string,
    options?: { collection?: string; limit?: number }
  ) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Search for items
      const items = await searchArchive({
        query: query.trim(),
        collection: options?.collection || 'opensource_audio',
        limit: options?.limit || 20
      });

      // Fetch metadata for each item to get audio URLs
      const tracksPromises = items.map(async (item: ArchiveItem) => {
        try {
          const metadata = await fetchArchiveMetadata(item.identifier);
          
          if (!metadata) {
            return null;
          }

          const audioFile = getBestAudioFile(metadata);
          
          if (!audioFile) {
            return null;
          }

          const track: StreamingTrack = {
            id: item.identifier,
            platform: StreamingPlatform.INTERNET_ARCHIVE,
            title: item.title || item.identifier,
            artist: item.creator || 'Unknown Artist',
            coverUrl: metadata.coverImage || `https://archive.org/services/img/${item.identifier}`,
            duration: audioFile.length ? audioFile.length * 1000 : 0,
            url: audioFile.url,
            uri: `https://archive.org/details/${item.identifier}`
          };

          return track;
        } catch (err) {
          console.error(`Failed to fetch metadata for ${item.identifier}:`, err);
          return null;
        }
      });

      const tracks = (await Promise.all(tracksPromises)).filter(
        (track): track is StreamingTrack => track !== null
      );

      setResults(tracks);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      console.error('Internet Archive search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    isLoading,
    error,
    search,
    clear
  };
}
