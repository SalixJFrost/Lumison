/**
 * Streaming Manager - Unified interface for multiple streaming platforms
 */

import {
  IStreamingPlayer,
  StreamingPlatform,
  StreamingTrack,
  StreamingPlayerConfig,
  StreamingPlayerEvent,
  StreamingPlaybackState,
  StreamingSearchOptions
} from './types';
import { YouTubePlayer } from './youtube/YouTubePlayer';
import { InternetArchivePlayer } from './archive/InternetArchivePlayer';

export class StreamingManager {
  private players: Map<StreamingPlatform, IStreamingPlayer> = new Map();
  private currentPlayer: IStreamingPlayer | null = null;
  private currentPlatform: StreamingPlatform | null = null;
  private eventListeners: Map<StreamingPlayerEvent, Set<Function>> = new Map();

  /**
   * Initialize a streaming platform
   */
  async initializePlatform(
    platform: StreamingPlatform,
    config: StreamingPlayerConfig
  ): Promise<void> {
    if (this.players.has(platform)) {
      console.warn(`Platform ${platform} already initialized`);
      return;
    }

    let player: IStreamingPlayer;

    switch (platform) {
      case StreamingPlatform.YOUTUBE:
        player = new YouTubePlayer();
        break;
      
      case StreamingPlatform.INTERNET_ARCHIVE:
        player = new InternetArchivePlayer();
        break;
      
      case StreamingPlatform.SPOTIFY:
        // TODO: Implement Spotify player
        throw new Error('Spotify player not yet implemented');
      
      case StreamingPlatform.APPLE_MUSIC:
        // TODO: Implement Apple Music player
        throw new Error('Apple Music player not yet implemented');
      
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    await player.initialize(config);
    this.setupPlayerEvents(player, platform);
    this.players.set(platform, player);

    console.log(`Platform ${platform} initialized successfully`);
  }

  /**
   * Check if a platform is initialized
   */
  isPlatformInitialized(platform: StreamingPlatform): boolean {
    return this.players.has(platform);
  }

  /**
   * Get available platforms
   */
  getAvailablePlatforms(): StreamingPlatform[] {
    return Array.from(this.players.keys());
  }

  /**
   * Play a track
   */
  async play(track: StreamingTrack): Promise<void> {
    // Switch platform if needed
    if (track.platform !== this.currentPlatform) {
      await this.switchPlatform(track.platform);
    }

    if (!this.currentPlayer) {
      throw new Error('No player available');
    }

    await this.currentPlayer.play(track);
  }

  /**
   * Pause current playback
   */
  async pause(): Promise<void> {
    if (!this.currentPlayer) {
      throw new Error('No active player');
    }
    await this.currentPlayer.pause();
  }

  /**
   * Resume current playback
   */
  async resume(): Promise<void> {
    if (!this.currentPlayer) {
      throw new Error('No active player');
    }
    await this.currentPlayer.resume();
  }

  /**
   * Seek to position
   */
  async seek(position: number): Promise<void> {
    if (!this.currentPlayer) {
      throw new Error('No active player');
    }
    await this.currentPlayer.seek(position);
  }

  /**
   * Set volume
   */
  async setVolume(volume: number): Promise<void> {
    if (!this.currentPlayer) {
      throw new Error('No active player');
    }
    await this.currentPlayer.setVolume(volume);
  }

  /**
   * Get current playback time
   */
  getCurrentTime(): number {
    return this.currentPlayer?.getCurrentTime() || 0;
  }

  /**
   * Get track duration
   */
  getDuration(): number {
    return this.currentPlayer?.getDuration() || 0;
  }

  /**
   * Get current playback state
   */
  getState(): StreamingPlaybackState | null {
    return this.currentPlayer?.getState() || null;
  }

  /**
   * Search across multiple platforms
   */
  async search(
    query: string,
    options: StreamingSearchOptions
  ): Promise<Map<StreamingPlatform, StreamingTrack[]>> {
    const results = new Map<StreamingPlatform, StreamingTrack[]>();

    await Promise.all(
      options.platforms.map(async (platform) => {
        const player = this.players.get(platform);
        if (!player) {
          console.warn(`Platform ${platform} not initialized`);
          return;
        }

        try {
          const tracks = await player.search(query, options.limit);
          results.set(platform, tracks);
        } catch (error) {
          console.error(`Search failed for ${platform}:`, error);
          results.set(platform, []);
        }
      })
    );

    return results;
  }

  /**
   * Get current platform
   */
  getCurrentPlatform(): StreamingPlatform | null {
    return this.currentPlatform;
  }

  /**
   * Switch to a different platform
   */
  private async switchPlatform(platform: StreamingPlatform): Promise<void> {
    const player = this.players.get(platform);
    if (!player) {
      throw new Error(`Platform ${platform} not initialized`);
    }

    // Pause current player
    if (this.currentPlayer) {
      try {
        await this.currentPlayer.pause();
      } catch (error) {
        console.error('Error pausing current player:', error);
      }
    }

    // Switch to new player
    this.currentPlayer = player;
    this.currentPlatform = platform;

    console.log(`Switched to platform: ${platform}`);
  }

  /**
   * Setup event forwarding from player to manager
   */
  private setupPlayerEvents(player: IStreamingPlayer, platform: StreamingPlatform): void {
    Object.values(StreamingPlayerEvent).forEach((event) => {
      player.on(event, (data) => {
        this.emit(event, { platform, data });
      });
    });
  }

  /**
   * Add event listener
   */
  on(event: StreamingPlayerEvent, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Remove event listener
   */
  off(event: StreamingPlayerEvent, callback: (data: any) => void): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: StreamingPlayerEvent, data: any): void {
    this.eventListeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  /**
   * Destroy all players and cleanup
   */
  destroy(): void {
    this.players.forEach((player) => {
      try {
        player.destroy();
      } catch (error) {
        console.error('Error destroying player:', error);
      }
    });

    this.players.clear();
    this.currentPlayer = null;
    this.currentPlatform = null;
    this.eventListeners.clear();
  }
}

// Singleton instance
let streamingManagerInstance: StreamingManager | null = null;

export function getStreamingManager(): StreamingManager {
  if (!streamingManagerInstance) {
    streamingManagerInstance = new StreamingManager();
  }
  return streamingManagerInstance;
}
