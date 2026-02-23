/**
 * Internet Archive Search Component
 * Example implementation showing how to search and play audio from archive.org
 */

import React, { useState } from 'react';
import { useInternetArchiveSearch } from '../hooks/useInternetArchiveSearch';
import { POPULAR_COLLECTIONS } from '../services/streaming/archive';
import { StreamingTrack } from '../services/streaming/types';

interface InternetArchiveSearchProps {
  onTrackSelect?: (track: StreamingTrack) => void;
}

export function InternetArchiveSearch({ onTrackSelect }: InternetArchiveSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('opensource_audio');
  const { results, isLoading, error, search, clear } = useInternetArchiveSearch();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      await search(query, {
        collection: selectedCollection,
        limit: 20
      });
    }
  };

  const handleClear = () => {
    setQuery('');
    clear();
  };

  return (
    <div className="internet-archive-search">
      <div className="search-header">
        <h2>Internet Archive Audio Search</h2>
        <p className="subtitle">
          Search legal, DRM-free audio from archive.org
        </p>
      </div>

      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for music, podcasts, audiobooks..."
            className="search-input"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="search-button"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
          {results.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="clear-button"
            >
              Clear
            </button>
          )}
        </div>

        <div className="collection-selector">
          <label htmlFor="collection">Collection:</label>
          <select
            id="collection"
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            disabled={isLoading}
          >
            {POPULAR_COLLECTIONS.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.name}
              </option>
            ))}
          </select>
        </div>
      </form>

      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
        </div>
      )}

      {isLoading && (
        <div className="loading-indicator">
          <p>Searching Internet Archive...</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="search-results">
          <p className="results-count">
            Found {results.length} track{results.length !== 1 ? 's' : ''}
          </p>
          <div className="results-grid">
            {results.map((track) => (
              <div key={track.id} className="track-card">
                {track.coverUrl && (
                  <img
                    src={track.coverUrl}
                    alt={track.title}
                    className="track-cover"
                    loading="lazy"
                  />
                )}
                <div className="track-info">
                  <h3 className="track-title">{track.title}</h3>
                  <p className="track-artist">{track.artist}</p>
                  {track.duration > 0 && (
                    <p className="track-duration">
                      {formatDuration(track.duration)}
                    </p>
                  )}
                  <div className="track-actions">
                    {onTrackSelect && (
                      <button
                        onClick={() => onTrackSelect(track)}
                        className="play-button"
                      >
                        Play
                      </button>
                    )}
                    <a
                      href={track.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="view-link"
                    >
                      View on Archive.org
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && !error && results.length === 0 && query && (
        <div className="no-results">
          <p>No results found for "{query}"</p>
          <p className="hint">Try different keywords or select another collection</p>
        </div>
      )}

      <div className="attribution">
        <p>
          Content provided by{' '}
          <a
            href="https://archive.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Internet Archive
          </a>
          {' '}under various licenses (Public Domain, Creative Commons, etc.)
        </p>
      </div>
    </div>
  );
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
