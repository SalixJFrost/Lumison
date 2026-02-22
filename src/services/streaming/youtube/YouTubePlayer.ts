/**
 * YouTube IFrame Player Implementation
 */

import {
  IStreamingPlayer,
  StreamingTrack,
  StreamingPlaybackState,
  StreamingPlayerConfig,
  StreamingPlayerEvent,
  StreamingPlatform
} from '../types';

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

export class YouTubePlayer implements IStreamingPlayer {
  private player: YT.Player | null = null;
  private containerId: string;
  private apiKey: string = '';
  private currentTrack: StreamingTrack | null = null;
  private ready: boolean = false;
  private eventListeners: Map<StreamingPlayerEvent, Set<Function>> = new Map();
  private updateInterval: number | null = null;

  constructor(containerId: string = 'youtube-player') {
    this.containerId = containerId;
  }

  async initialize(config: StreamingPlayerConfig): Promise<void> {
    if (config.apiKey) {
      this.apiKey = config.apiKey;
    }

    await this.loadSDK();
    this.ready = true;
    this.emit(StreamingPlayerEvent.READY, undefined);
  }

  isAuthorized(): boolean {
    // YouTube doesn't require authorization for public videos
    return true;
  }

  private async loadSDK(): Promise<void> {
    return new Promise((resolve) => {
      if (window.YT && window.YT.Player) {
        resolve();
        return;
      }

      window.onYouTubeIframeAPIReady = () => {
        resolve();
      };

      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(script);
    });
  }

  private createPlayerElement(): void {
    if (!document.getElementById(this.containerId)) {
      const container = document.createElement('div');
      container.id = this.containerId;
      container.style.position = 'fixed';
      container.style.top = '-9999px';
      container.style.left = '-9999px';
      document.body.appendChild(container);
    }
  }

  async play(track: StreamingTrack): Promise<void> {
    this.currentTrack = track;

    if (!this.player) {
      await this.createPlayer(track.id);
    } else {
      this.player.loadVideoById(track.id);
    }

    this.startTimeUpdate();
    this.emit(StreamingPlayerEvent.PLAYING, track);
  }

  private createPlayer(videoId: string): Promise<void> {
    this.createPlayerElement();

    return new Promise((resolve, reject) => {
      this.player = new YT.Player(this.containerId, {
        height: '0',
        width: '0',
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0
        },
        events: {
          onReady: () => resolve(),
          onError: (event) => {
            const error = new Error(`YouTube Player Error: ${event.data}`);
            this.emit(StreamingPlayerEvent.ERROR, error);
            reject(error);
          },
          onStateChange: (event) => this.handleStateChange(event)
        }
      });
    });
  }

  async pause(): Promise<void> {
    this.player?.pauseVideo();
    this.stopTimeUpdate();
    this.emit(StreamingPlayerEvent.PAUSED, undefined);
  }

  async resume(): Promise<void> {
    this.player?.playVideo();
    this.startTimeUpdate();
    if (this.currentTrack) {
      this.emit(StreamingPlayerEvent.PLAYING, this.currentTrack);
    }
  }

  async seek(position: number): Promise<void> {
    this.player?.seekTo(position, true);
  }

  async setVolume(volume: number): Promise<void> {
    this.player?.setVolume(volume * 100);
  }

  getCurrentTime(): number {
    return this.player?.getCurrentTime() || 0;
  }

  getDuration(): number {
    return this.player?.getDuration() || 0;
  }

  getState(): StreamingPlaybackState {
    const playerState = this.player?.getPlayerState();
    const isPlaying = playerState === YT.PlayerState.PLAYING;

    return {
      isPlaying,
      currentTime: this.getCurrentTime(),
      duration: this.getDuration(),
      volume: (this.player?.getVolume() || 50) / 100,
      track: this.currentTrack
    };
  }

  async search(query: string, limit: number = 20): Promise<StreamingTrack[]> {
    if (!this.apiKey) {
      throw new Error('YouTube API key not configured');
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&q=${encodeURIComponent(query)}&` +
      `type=video&videoCategoryId=10&maxResults=${limit}&key=${this.apiKey}`
    );

    if (!response.ok) {
      throw new Error('YouTube search failed');
    }

    const data = await response.json();

    return data.items.map((item: any) => ({
      id: item.id.videoId,
      platform: StreamingPlatform.YOUTUBE,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      coverUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
      duration: 0, // Would need additional API call to get duration
      uri: `https://www.youtube.com/watch?v=${item.id.videoId}`
    }));
  }

  isReady(): boolean {
    return this.ready;
  }

  destroy(): void {
    this.stopTimeUpdate();
    this.player?.destroy();
    this.player = null;
    this.currentTrack = null;
    this.ready = false;
    this.eventListeners.clear();

    const element = document.getElementById(this.containerId);
    if (element) {
      element.remove();
    }
  }

  on(event: StreamingPlayerEvent, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off(event: StreamingPlayerEvent, callback: (data: any) => void): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  private emit(event: StreamingPlayerEvent, data: any): void {
    this.eventListeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  private handleStateChange(event: YT.OnStateChangeEvent): void {
    switch (event.data) {
      case YT.PlayerState.PLAYING:
        this.startTimeUpdate();
        if (this.currentTrack) {
          this.emit(StreamingPlayerEvent.PLAYING, this.currentTrack);
        }
        break;
      case YT.PlayerState.PAUSED:
        this.stopTimeUpdate();
        this.emit(StreamingPlayerEvent.PAUSED, undefined);
        break;
      case YT.PlayerState.ENDED:
        this.stopTimeUpdate();
        this.emit(StreamingPlayerEvent.ENDED, undefined);
        break;
    }

    this.emit(StreamingPlayerEvent.STATE_CHANGE, this.getState());
  }

  private startTimeUpdate(): void {
    if (this.updateInterval) return;

    this.updateInterval = window.setInterval(() => {
      this.emit(StreamingPlayerEvent.TIME_UPDATE, {
        currentTime: this.getCurrentTime(),
        duration: this.getDuration()
      });
    }, 100);
  }

  private stopTimeUpdate(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}
