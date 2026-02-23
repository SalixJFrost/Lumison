/**
 * Complete Example: Internet Archive Integration
 * 
 * This example shows how to integrate Internet Archive audio streaming
 * into your existing music player application.
 */

import React, { useEffect, useState } from 'react';
import { getStreamingManager } from '../src/services/streaming/StreamingManager';
import { StreamingPlatform, StreamingPlayerEvent, StreamingTrack } from '../src/services/streaming/types';
import { useInternetArchiveSearch } from '../src/hooks/useInternetArchiveSearch';
import { POPULAR_COLLECTIONS } from '../src/services/streaming/archive';

/**
 * Example 1: Basic Integration
 * Initialize and play a track from Internet Archive
 */
export function BasicExample() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<StreamingTrack | null>(null);

  useEffect(() => {
    async function init() {
      const manager = getStreamingManager();
      
      // Initialize Internet Archive platform (no API key needed!)
      await manager.initializePlatform(StreamingPlatform.INTERNET_ARCHIVE, {});
      
      // Setup event listeners
      manager.on(StreamingPlayerEvent.PLAYING, (data) => {
        setIsPlaying(true);
        setCurrentTrack(data.data);
      });
      
      manager.on(StreamingPlayerEvent.PAUSED, () => {
        setIsPlaying(false);
      });
      
      // Search for music
      const results = await manager.search('classical piano', {
        platforms: [StreamingPlatform.INTERNET_ARCHIVE],
        limit: 5
      });
      
      const tracks = results.get(StreamingPlatform.INTERNET_ARCHIVE);
      if (tracks && tracks.length > 0) {
        // Play first track
        await manager.play(tracks[0]);
      }
    }
    
    init();
  }, []);

  return (
    <div>
      <h2>Basic Example</h2>
      {currentTrack && (
        <div>
          <p>Now Playing: {currentTrack.title}</p>
          <p>Artist: {currentTrack.artist}</p>
          <p>Status: {isPlaying ? 'Playing' : 'Paused'}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Example 2: Search Component
 * Full-featured search with collection selector
 */
export function SearchExample() {
  const [query, setQuery] = useState('');
  const [collection, setCollection] = useState('opensource_audio');
  const { results, isLoading, error, search } = useInternetArchiveSearch();
  const manager = getStreamingManager();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await search(query, { collection, limit: 20 });
  };

  const handlePlay = async (track: StreamingTrack) => {
    // Initialize if not already done
    if (!manager.isPlatformInitialized(StreamingPlatform.INTERNET_ARCHIVE)) {
      await manager.initializePlatform(StreamingPlatform.INTERNET_ARCHIVE, {});
    }
    
    await manager.play(track);
  };

  return (
    <div className="search-example">
      <h2>Search Example</h2>
      
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for music..."
        />
        
        <select value={collection} onChange={(e) => setCollection(e.target.value)}>
          {POPULAR_COLLECTIONS.map(col => (
            <option key={col.id} value={col.id}>{col.name}</option>
          ))}
        </select>
        
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      <div className="results">
        {results.map(track => (
          <div key={track.id} className="track-item">
            <img src={track.coverUrl} alt={track.title} />
            <div>
              <h3>{track.title}</h3>
              <p>{track.artist}</p>
              <button onClick={() => handlePlay(track)}>Play</button>
              <a href={track.uri} target="_blank" rel="noopener noreferrer">
                View on Archive.org
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Example 3: Multi-Platform Player
 * Support both YouTube and Internet Archive
 */
export function MultiPlatformExample() {
  const [selectedPlatform, setSelectedPlatform] = useState<StreamingPlatform>(
    StreamingPlatform.INTERNET_ARCHIVE
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Map<StreamingPlatform, StreamingTrack[]>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function init() {
      const manager = getStreamingManager();
      
      // Initialize both platforms
      await manager.initializePlatform(StreamingPlatform.INTERNET_ARCHIVE, {});
      
      // Uncomment if you have YouTube API key
      // await manager.initializePlatform(StreamingPlatform.YOUTUBE, {
      //   apiKey: 'YOUR_API_KEY'
      // });
    }
    
    init();
  }, []);

  const handleSearch = async () => {
    setIsLoading(true);
    const manager = getStreamingManager();
    
    try {
      const searchResults = await manager.search(searchQuery, {
        platforms: [selectedPlatform],
        limit: 20
      });
      
      setResults(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlay = async (track: StreamingTrack) => {
    const manager = getStreamingManager();
    await manager.play(track);
  };

  const platformResults = results.get(selectedPlatform) || [];

  return (
    <div className="multi-platform-example">
      <h2>Multi-Platform Example</h2>
      
      <div className="platform-selector">
        <label>
          <input
            type="radio"
            value={StreamingPlatform.INTERNET_ARCHIVE}
            checked={selectedPlatform === StreamingPlatform.INTERNET_ARCHIVE}
            onChange={(e) => setSelectedPlatform(e.target.value as StreamingPlatform)}
          />
          Internet Archive (Legal, Free)
        </label>
        
        <label>
          <input
            type="radio"
            value={StreamingPlatform.YOUTUBE}
            checked={selectedPlatform === StreamingPlatform.YOUTUBE}
            onChange={(e) => setSelectedPlatform(e.target.value as StreamingPlatform)}
          />
          YouTube (Requires API Key)
        </label>
      </div>

      <div className="search-bar">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for music..."
        />
        <button onClick={handleSearch} disabled={isLoading}>
          Search
        </button>
      </div>

      <div className="results">
        <h3>Results from {selectedPlatform}</h3>
        {platformResults.map(track => (
          <div key={track.id}>
            <h4>{track.title}</h4>
            <p>{track.artist}</p>
            <button onClick={() => handlePlay(track)}>Play</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Example 4: Playback Controls
 * Full player with controls
 */
export function PlayerControlsExample() {
  const [currentTrack, setCurrentTrack] = useState<StreamingTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    const manager = getStreamingManager();
    
    async function init() {
      await manager.initializePlatform(StreamingPlatform.INTERNET_ARCHIVE, {});
      
      // Setup event listeners
      manager.on(StreamingPlayerEvent.PLAYING, (data) => {
        setIsPlaying(true);
        setCurrentTrack(data.data);
      });
      
      manager.on(StreamingPlayerEvent.PAUSED, () => {
        setIsPlaying(false);
      });
      
      manager.on(StreamingPlayerEvent.TIME_UPDATE, (data) => {
        setCurrentTime(data.data.currentTime);
        setDuration(data.data.duration);
      });
      
      manager.on(StreamingPlayerEvent.ENDED, () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });
    }
    
    init();
  }, []);

  const handlePlayPause = async () => {
    const manager = getStreamingManager();
    if (isPlaying) {
      await manager.pause();
    } else {
      await manager.resume();
    }
  };

  const handleSeek = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const manager = getStreamingManager();
    const newTime = parseFloat(e.target.value);
    await manager.seek(newTime);
  };

  const handleVolumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const manager = getStreamingManager();
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    await manager.setVolume(newVolume);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="player-controls-example">
      <h2>Player Controls Example</h2>
      
      {currentTrack && (
        <div className="now-playing">
          <img src={currentTrack.coverUrl} alt={currentTrack.title} />
          <div>
            <h3>{currentTrack.title}</h3>
            <p>{currentTrack.artist}</p>
          </div>
        </div>
      )}

      <div className="controls">
        <button onClick={handlePlayPause}>
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
      </div>

      <div className="progress">
        <span>{formatTime(currentTime)}</span>
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
        />
        <span>{formatTime(duration)}</span>
      </div>

      <div className="volume">
        <span>🔊</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
        />
      </div>
    </div>
  );
}

/**
 * Example 5: Collection Browser
 * Browse popular Internet Archive collections
 */
export function CollectionBrowserExample() {
  const [selectedCollection, setSelectedCollection] = useState(POPULAR_COLLECTIONS[0]);
  const { results, isLoading, search } = useInternetArchiveSearch();

  useEffect(() => {
    // Load initial collection
    search('', {
      collection: selectedCollection.id,
      limit: 20
    });
  }, [selectedCollection]);

  return (
    <div className="collection-browser-example">
      <h2>Collection Browser Example</h2>
      
      <div className="collections">
        {POPULAR_COLLECTIONS.map(collection => (
          <button
            key={collection.id}
            onClick={() => setSelectedCollection(collection)}
            className={selectedCollection.id === collection.id ? 'active' : ''}
          >
            {collection.name}
          </button>
        ))}
      </div>

      <div className="collection-content">
        <h3>{selectedCollection.name}</h3>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <div className="tracks">
            {results.map(track => (
              <div key={track.id} className="track">
                <img src={track.coverUrl} alt={track.title} />
                <div>
                  <h4>{track.title}</h4>
                  <p>{track.artist}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Example 6: Complete App Integration
 * Shows how to integrate into your main App component
 */
export function CompleteAppExample() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    async function initializeApp() {
      const manager = getStreamingManager();
      
      // Initialize Internet Archive
      await manager.initializePlatform(StreamingPlatform.INTERNET_ARCHIVE, {});
      
      // Setup global event listeners
      manager.on(StreamingPlayerEvent.ERROR, (data) => {
        console.error('Playback error:', data.data);
        // Show error toast to user
      });
      
      setIsInitialized(true);
    }
    
    initializeApp();
  }, []);

  if (!isInitialized) {
    return <div>Initializing...</div>;
  }

  return (
    <div className="app">
      <header>
        <h1>My Music Player</h1>
        <p>Powered by Internet Archive</p>
      </header>
      
      <main>
        <SearchExample />
        <PlayerControlsExample />
      </main>
      
      <footer>
        <p>
          Content provided by{' '}
          <a href="https://archive.org" target="_blank" rel="noopener noreferrer">
            Internet Archive
          </a>
        </p>
      </footer>
    </div>
  );
}

// Export all examples
export default {
  BasicExample,
  SearchExample,
  MultiPlatformExample,
  PlayerControlsExample,
  CollectionBrowserExample,
  CompleteAppExample
};
