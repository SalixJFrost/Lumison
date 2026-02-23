/**
 * Hook for fetching cover art
 */

import { useState, useEffect } from 'react';
import { searchCoverArtCached, CoverArtResult } from '../services/coverArtService';

export interface UseCoverArtOptions {
  artist: string;
  album?: string;
  track?: string;
  mbid?: string;
  fallbackUrl?: string;
  enabled?: boolean;
}

export interface UseCoverArtResult {
  coverUrl: string | undefined;
  isLoading: boolean;
  error: Error | null;
  source: CoverArtResult['source'] | null;
  refetch: () => Promise<void>;
}

export function useCoverArt(options: UseCoverArtOptions): UseCoverArtResult {
  const { artist, album, track, mbid, fallbackUrl, enabled = true } = options;
  
  const [coverUrl, setCoverUrl] = useState<string | undefined>(fallbackUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [source, setSource] = useState<CoverArtResult['source'] | null>(null);

  const fetchCoverArt = async () => {
    if (!enabled || !artist) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await searchCoverArtCached({
        artist,
        album,
        track,
        mbid,
      });

      if (result) {
        setCoverUrl(result.url);
        setSource(result.source);
      } else if (fallbackUrl) {
        setCoverUrl(fallbackUrl);
        setSource('fallback');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch cover art');
      setError(error);
      console.error('Cover art fetch error:', error);
      
      // Use fallback on error
      if (fallbackUrl) {
        setCoverUrl(fallbackUrl);
        setSource('fallback');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoverArt();
  }, [artist, album, track, mbid, enabled]);

  return {
    coverUrl,
    isLoading,
    error,
    source,
    refetch: fetchCoverArt,
  };
}
