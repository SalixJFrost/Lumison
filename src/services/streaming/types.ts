/**
 * Streaming Platform Types and Interfaces
 */

export enum StreamingPlatform {
  SPOTIFY = 'spotify',
  APPLE_MUSIC = 'apple_music',
  YOUTUBE = 'youtube',
  NETEASE = 'netease',
  INTERNET_ARCHIVE = 'internet_archive',
  LOCAL = 'local'
}

export interface StreamingTrack {
  id: string;
  platform: StreamingPlatform;
  title: string;
  artist: string;
  album?: string;
  coverUrl: string;
  duration: number;
  uri?: string; // Platform-specific URI (e.g., spotify:track:xxx)
  url?: string; // Direct playback URL
}

export interface StreamingPlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  track: StreamingTrack | null;
}

export interface StreamingPlayerConfig {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  apiKey?: string;
  developerToken?: string;
}

export interface IStreamingPlayer {
  /**
   * Initialize the player with configuration
   */
  initialize(config: StreamingPlayerConfig): Promise<void>;

  /**
   * Authorize user (if required by platform)
   */
  authorize?(): Promise<void>;

  /**
   * Check if user is authorized
   */
  isAuthorized(): boolean;

  /**
   * Play a track
   */
  play(track: StreamingTrack): Promise<void>;

  /**
   * Pause playback
   */
  pause(): Promise<void>;

  /**
   * Resume playback
   */
  resume(): Promise<void>;

  /**
   * Seek to position (in seconds)
   */
  seek(position: number): Promise<void>;

  /**
   * Set volume (0-1)
   */
  setVolume(volume: number): Promise<void>;

  /**
   * Get current playback time (in seconds)
   */
  getCurrentTime(): number;

  /**
   * Get track duration (in seconds)
   */
  getDuration(): number;

  /**
   * Get current playback state
   */
  getState(): StreamingPlaybackState;

  /**
   * Search for tracks
   */
  search(query: string, limit?: number): Promise<StreamingTrack[]>;

  /**
   * Check if player is ready
   */
  isReady(): boolean;

  /**
   * Destroy player and cleanup resources
   */
  destroy(): void;

  /**
   * Add event listener
   */
  on(event: StreamingPlayerEvent, callback: (data: any) => void): void;

  /**
   * Remove event listener
   */
  off(event: StreamingPlayerEvent, callback: (data: any) => void): void;
}

export enum StreamingPlayerEvent {
  READY = 'ready',
  PLAYING = 'playing',
  PAUSED = 'paused',
  ENDED = 'ended',
  TIME_UPDATE = 'timeupdate',
  ERROR = 'error',
  STATE_CHANGE = 'statechange'
}

export interface StreamingPlayerEventData {
  [StreamingPlayerEvent.READY]: void;
  [StreamingPlayerEvent.PLAYING]: StreamingTrack;
  [StreamingPlayerEvent.PAUSED]: void;
  [StreamingPlayerEvent.ENDED]: void;
  [StreamingPlayerEvent.TIME_UPDATE]: { currentTime: number; duration: number };
  [StreamingPlayerEvent.ERROR]: Error;
  [StreamingPlayerEvent.STATE_CHANGE]: StreamingPlaybackState;
}

export interface StreamingSearchOptions {
  platforms: StreamingPlatform[];
  limit?: number;
  offset?: number;
}

export interface StreamingSearchResult {
  platform: StreamingPlatform;
  tracks: StreamingTrack[];
  total: number;
}
