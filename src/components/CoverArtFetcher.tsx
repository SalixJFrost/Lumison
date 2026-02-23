/**
 * Cover Art Fetcher Component
 * Example component showing how to use the cover art service
 */

import React from 'react';
import { useCoverArt } from '../hooks/useCoverArt';

interface CoverArtFetcherProps {
  artist: string;
  album?: string;
  track?: string;
  mbid?: string;
  fallbackUrl?: string;
  onCoverFetched?: (url: string) => void;
}

/**
 * Example usage:
 * 
 * <CoverArtFetcher
 *   artist="The Beatles"
 *   album="Abbey Road"
 *   onCoverFetched={(url) => console.log('Cover URL:', url)}
 * />
 * 
 * Or with MusicBrainz ID:
 * 
 * <CoverArtFetcher
 *   artist="Pink Floyd"
 *   mbid="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *   onCoverFetched={(url) => console.log('Cover URL:', url)}
 * />
 */
const CoverArtFetcher: React.FC<CoverArtFetcherProps> = ({
  artist,
  album,
  track,
  mbid,
  fallbackUrl,
  onCoverFetched,
}) => {
  const { coverUrl, isLoading, error, source } = useCoverArt({
    artist,
    album,
    track,
    mbid,
    fallbackUrl,
  });

  React.useEffect(() => {
    if (coverUrl && onCoverFetched) {
      onCoverFetched(coverUrl);
    }
  }, [coverUrl, onCoverFetched]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        <p>Failed to fetch cover art</p>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  if (!coverUrl) {
    return (
      <div className="p-4 text-white/50">
        <p>No cover art found</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <img
        src={coverUrl}
        alt={`${artist} - ${album || track || 'Cover'}`}
        className="w-full h-full object-cover rounded-lg"
        loading="lazy"
      />
      {source && (
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-xs text-white/70">
          {source === 'coverartarchive' && 'Cover Art Archive'}
          {source === 'itunes' && 'iTunes'}
          {source === 'fallback' && 'Fallback'}
        </div>
      )}
    </div>
  );
};

export default CoverArtFetcher;
