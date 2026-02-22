# 流媒体平台集成方案

## 概述

本文档描述如何将 Spotify、Apple Music 和 YouTube 三个主流流媒体平台集成到 Lumison 音乐播放器中。

## 平台对比

| 平台 | SDK | 要求 | 优势 | 限制 |
|------|-----|------|------|------|
| **Spotify** | Web Playback SDK | Premium 订阅 | 全球最大音乐库 | 需要付费订阅 |
| **Apple Music** | MusicKit JS | Apple Music 订阅 | 高品质音频 | 仅 iOS/macOS 最佳体验 |
| **YouTube** | IFrame Player API | 无 | 免费、内容丰富 | 视频为主，音质一般 |

## 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Lumison Player                          │
├─────────────────────────────────────────────────────────────┤
│                   Unified Player Interface                   │
│  ┌──────────────┬──────────────┬──────────────────────────┐ │
│  │   Spotify    │ Apple Music  │       YouTube            │ │
│  │   Provider   │   Provider   │       Provider           │ │
│  └──────────────┴──────────────┴──────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Platform Adapters                         │
│  ┌──────────────┬──────────────┬──────────────────────────┐ │
│  │  Spotify SDK │  MusicKit JS │  YouTube IFrame API      │ │
│  └──────────────┴──────────────┴──────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 1. Spotify Web Playback SDK 集成

### 1.1 前置要求

- Spotify Premium 账户
- Spotify Developer 应用（获取 Client ID）
- OAuth 2.0 认证流程

### 1.2 实现步骤

#### 步骤 1: 注册 Spotify 应用

1. 访问 [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. 创建新应用
3. 获取 `Client ID` 和 `Client Secret`
4. 添加重定向 URI: `http://localhost:5173/callback` (开发) 和 `https://yourdomain.com/callback` (生产)

#### 步骤 2: 安装依赖

```bash
npm install @spotify/web-playback-sdk
```

#### 步骤 3: 实现认证

```typescript
// src/services/streaming/spotify/auth.ts
export class SpotifyAuth {
  private clientId: string;
  private redirectUri: string;
  private scopes = [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-library-read',
    'user-library-modify',
    'user-read-playback-state',
    'user-modify-playback-state'
  ];

  async authorize(): Promise<string> {
    const authUrl = new URL('https://accounts.spotify.com/authorize');
    authUrl.searchParams.append('client_id', this.clientId);
    authUrl.searchParams.append('response_type', 'token');
    authUrl.searchParams.append('redirect_uri', this.redirectUri);
    authUrl.searchParams.append('scope', this.scopes.join(' '));
    
    window.location.href = authUrl.toString();
  }

  getAccessTokenFromUrl(): string | null {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    return params.get('access_token');
  }
}
```

#### 步骤 4: 初始化播放器

```typescript
// src/services/streaming/spotify/player.ts
export class SpotifyPlayer {
  private player: Spotify.Player | null = null;
  private deviceId: string | null = null;

  async initialize(accessToken: string): Promise<void> {
    await this.loadSDK();
    
    this.player = new Spotify.Player({
      name: 'Lumison Player',
      getOAuthToken: cb => cb(accessToken),
      volume: 0.5
    });

    // 错误处理
    this.player.addListener('initialization_error', ({ message }) => {
      console.error('Initialization Error:', message);
    });

    this.player.addListener('authentication_error', ({ message }) => {
      console.error('Authentication Error:', message);
    });

    this.player.addListener('account_error', ({ message }) => {
      console.error('Account Error:', message);
    });

    // 就绪事件
    this.player.addListener('ready', ({ device_id }) => {
      console.log('Ready with Device ID', device_id);
      this.deviceId = device_id;
    });

    // 播放状态变化
    this.player.addListener('player_state_changed', state => {
      if (!state) return;
      this.handleStateChange(state);
    });

    // 连接播放器
    await this.player.connect();
  }

  private async loadSDK(): Promise<void> {
    return new Promise((resolve) => {
      if (window.Spotify) {
        resolve();
        return;
      }

      window.onSpotifyWebPlaybackSDKReady = () => {
        resolve();
      };

      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      document.head.appendChild(script);
    });
  }

  async play(trackUri: string): Promise<void> {
    if (!this.deviceId) throw new Error('Device not ready');

    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`, {
      method: 'PUT',
      body: JSON.stringify({ uris: [trackUri] }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`
      }
    });
  }

  async pause(): Promise<void> {
    await this.player?.pause();
  }

  async resume(): Promise<void> {
    await this.player?.resume();
  }

  async seek(positionMs: number): Promise<void> {
    await this.player?.seek(positionMs);
  }

  async setVolume(volume: number): Promise<void> {
    await this.player?.setVolume(volume);
  }
}
```

### 1.3 搜索和获取曲目

```typescript
// src/services/streaming/spotify/api.ts
export class SpotifyAPI {
  private accessToken: string;

  async search(query: string, type: 'track' | 'album' | 'artist' = 'track') {
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type}&limit=20`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      }
    );
    return response.json();
  }

  async getTrack(trackId: string) {
    const response = await fetch(
      `https://api.spotify.com/v1/tracks/${trackId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      }
    );
    return response.json();
  }
}
```

## 2. Apple Music MusicKit JS 集成

### 2.1 前置要求

- Apple Developer 账户
- MusicKit 标识符和私钥
- Apple Music 订阅（用户）

### 2.2 实现步骤

#### 步骤 1: 配置 Apple Developer

1. 访问 [Apple Developer Portal](https://developer.apple.com/)
2. 创建 MusicKit 标识符
3. 生成 MusicKit 私钥（.p8 文件）
4. 记录 Team ID 和 Key ID

#### 步骤 2: 生成 Developer Token

```typescript
// 注意：这应该在后端完成，这里仅作示例
// src/services/streaming/apple/token.ts
import jwt from 'jsonwebtoken';
import fs from 'fs';

export function generateDeveloperToken(): string {
  const privateKey = fs.readFileSync('path/to/AuthKey.p8', 'utf8');
  
  const token = jwt.sign({}, privateKey, {
    algorithm: 'ES256',
    expiresIn: '180d',
    issuer: 'YOUR_TEAM_ID',
    header: {
      alg: 'ES256',
      kid: 'YOUR_KEY_ID'
    }
  });
  
  return token;
}
```

#### 步骤 3: 初始化 MusicKit

```typescript
// src/services/streaming/apple/player.ts
export class AppleMusicPlayer {
  private music: MusicKit.MusicKitInstance | null = null;

  async initialize(developerToken: string): Promise<void> {
    await this.loadSDK();

    this.music = MusicKit.configure({
      developerToken: developerToken,
      app: {
        name: 'Lumison',
        build: '1.0.0'
      }
    });

    // 监听播放状态
    this.music.addEventListener('playbackStateDidChange', () => {
      this.handlePlaybackStateChange();
    });

    this.music.addEventListener('nowPlayingItemDidChange', () => {
      this.handleNowPlayingItemChange();
    });
  }

  private async loadSDK(): Promise<void> {
    return new Promise((resolve) => {
      if (window.MusicKit) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js-cdn.music.apple.com/musickit/v3/musickit.js';
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  }

  async authorize(): Promise<void> {
    const userToken = await this.music!.authorize();
    return userToken;
  }

  async play(songId: string): Promise<void> {
    await this.music!.setQueue({
      song: songId
    });
    await this.music!.play();
  }

  async pause(): Promise<void> {
    await this.music!.pause();
  }

  async seek(time: number): Promise<void> {
    this.music!.seekToTime(time);
  }

  async setVolume(volume: number): Promise<void> {
    this.music!.volume = volume;
  }

  async search(query: string): Promise<any> {
    const results = await this.music!.api.music('/v1/catalog/us/search', {
      term: query,
      types: 'songs',
      limit: 20
    });
    return results;
  }
}
```

## 3. YouTube IFrame Player API 集成

### 3.1 前置要求

- YouTube Data API v3 密钥（用于搜索）
- 无需用户认证（公开内容）

### 3.2 实现步骤

#### 步骤 1: 获取 API 密钥

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建项目
3. 启用 YouTube Data API v3
4. 创建 API 密钥

#### 步骤 2: 实现播放器

```typescript
// src/services/streaming/youtube/player.ts
export class YouTubePlayer {
  private player: YT.Player | null = null;
  private containerId: string;

  async initialize(containerId: string): Promise<void> {
    this.containerId = containerId;
    await this.loadSDK();
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

  createPlayer(videoId: string): Promise<void> {
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
          playsinline: 1
        },
        events: {
          onReady: () => resolve(),
          onError: (event) => reject(event),
          onStateChange: (event) => this.handleStateChange(event)
        }
      });
    });
  }

  async play(): Promise<void> {
    this.player?.playVideo();
  }

  async pause(): Promise<void> {
    this.player?.pauseVideo();
  }

  async seek(seconds: number): Promise<void> {
    this.player?.seekTo(seconds, true);
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

  private handleStateChange(event: YT.OnStateChangeEvent): void {
    switch (event.data) {
      case YT.PlayerState.PLAYING:
        console.log('Playing');
        break;
      case YT.PlayerState.PAUSED:
        console.log('Paused');
        break;
      case YT.PlayerState.ENDED:
        console.log('Ended');
        break;
    }
  }
}
```

#### 步骤 3: 搜索功能

```typescript
// src/services/streaming/youtube/api.ts
export class YouTubeAPI {
  private apiKey: string;

  async search(query: string): Promise<any> {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&q=${encodeURIComponent(query)}&` +
      `type=video&videoCategoryId=10&maxResults=20&key=${this.apiKey}`
    );
    return response.json();
  }

  async getVideoDetails(videoId: string): Promise<any> {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?` +
      `part=snippet,contentDetails&id=${videoId}&key=${this.apiKey}`
    );
    return response.json();
  }
}
```

## 4. 统一播放器接口

### 4.1 抽象接口定义

```typescript
// src/services/streaming/types.ts
export enum StreamingPlatform {
  SPOTIFY = 'spotify',
  APPLE_MUSIC = 'apple_music',
  YOUTUBE = 'youtube',
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
  uri?: string; // Spotify URI or platform-specific identifier
}

export interface IStreamingPlayer {
  initialize(): Promise<void>;
  authorize?(): Promise<void>;
  play(track: StreamingTrack): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  seek(position: number): Promise<void>;
  setVolume(volume: number): Promise<void>;
  getCurrentTime(): number;
  getDuration(): number;
  search(query: string): Promise<StreamingTrack[]>;
  isReady(): boolean;
  destroy(): void;
}
```

### 4.2 播放器管理器

```typescript
// src/services/streaming/StreamingManager.ts
export class StreamingManager {
  private players: Map<StreamingPlatform, IStreamingPlayer> = new Map();
  private currentPlayer: IStreamingPlayer | null = null;
  private currentPlatform: StreamingPlatform | null = null;

  async initializePlatform(platform: StreamingPlatform, config: any): Promise<void> {
    let player: IStreamingPlayer;

    switch (platform) {
      case StreamingPlatform.SPOTIFY:
        player = new SpotifyPlayerAdapter(config);
        break;
      case StreamingPlatform.APPLE_MUSIC:
        player = new AppleMusicPlayerAdapter(config);
        break;
      case StreamingPlatform.YOUTUBE:
        player = new YouTubePlayerAdapter(config);
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    await player.initialize();
    this.players.set(platform, player);
  }

  async play(track: StreamingTrack): Promise<void> {
    // 切换平台
    if (track.platform !== this.currentPlatform) {
      await this.switchPlatform(track.platform);
    }

    if (!this.currentPlayer) {
      throw new Error('No player available');
    }

    await this.currentPlayer.play(track);
  }

  private async switchPlatform(platform: StreamingPlatform): Promise<void> {
    // 暂停当前播放器
    if (this.currentPlayer) {
      await this.currentPlayer.pause();
    }

    // 切换到新播放器
    const player = this.players.get(platform);
    if (!player) {
      throw new Error(`Platform ${platform} not initialized`);
    }

    this.currentPlayer = player;
    this.currentPlatform = platform;
  }

  async search(query: string, platforms: StreamingPlatform[]): Promise<StreamingTrack[]> {
    const results = await Promise.all(
      platforms.map(async (platform) => {
        const player = this.players.get(platform);
        if (!player) return [];
        try {
          return await player.search(query);
        } catch (error) {
          console.error(`Search failed for ${platform}:`, error);
          return [];
        }
      })
    );

    return results.flat();
  }

  // 代理方法
  async pause(): Promise<void> {
    await this.currentPlayer?.pause();
  }

  async resume(): Promise<void> {
    await this.currentPlayer?.resume();
  }

  async seek(position: number): Promise<void> {
    await this.currentPlayer?.seek(position);
  }

  async setVolume(volume: number): Promise<void> {
    await this.currentPlayer?.setVolume(volume);
  }
}
```

## 5. UI 集成

### 5.1 平台选择器

```typescript
// src/components/PlatformSelector.tsx
import React from 'react';
import { StreamingPlatform } from '../services/streaming/types';

interface PlatformSelectorProps {
  selectedPlatforms: StreamingPlatform[];
  onPlatformsChange: (platforms: StreamingPlatform[]) => void;
}

export const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  selectedPlatforms,
  onPlatformsChange
}) => {
  const platforms = [
    { id: StreamingPlatform.SPOTIFY, name: 'Spotify', icon: '🎵', color: '#1DB954' },
    { id: StreamingPlatform.APPLE_MUSIC, name: 'Apple Music', icon: '🍎', color: '#FA243C' },
    { id: StreamingPlatform.YOUTUBE, name: 'YouTube', icon: '▶️', color: '#FF0000' }
  ];

  const togglePlatform = (platform: StreamingPlatform) => {
    if (selectedPlatforms.includes(platform)) {
      onPlatformsChange(selectedPlatforms.filter(p => p !== platform));
    } else {
      onPlatformsChange([...selectedPlatforms, platform]);
    }
  };

  return (
    <div className="flex gap-2">
      {platforms.map(platform => (
        <button
          key={platform.id}
          onClick={() => togglePlatform(platform.id)}
          className={`px-4 py-2 rounded-lg transition-all ${
            selectedPlatforms.includes(platform.id)
              ? 'bg-white/20 border-2'
              : 'bg-white/5 border border-white/10'
          }`}
          style={{
            borderColor: selectedPlatforms.includes(platform.id) ? platform.color : undefined
          }}
        >
          <span className="mr-2">{platform.icon}</span>
          {platform.name}
        </button>
      ))}
    </div>
  );
};
```

### 5.2 搜索结果展示

```typescript
// src/components/StreamingSearchResults.tsx
import React from 'react';
import { StreamingTrack, StreamingPlatform } from '../services/streaming/types';

interface StreamingSearchResultsProps {
  results: StreamingTrack[];
  onPlay: (track: StreamingTrack) => void;
  onAddToQueue: (track: StreamingTrack) => void;
}

export const StreamingSearchResults: React.FC<StreamingSearchResultsProps> = ({
  results,
  onPlay,
  onAddToQueue
}) => {
  const getPlatformBadge = (platform: StreamingPlatform) => {
    const badges = {
      [StreamingPlatform.SPOTIFY]: { text: 'Spotify', color: 'bg-green-500' },
      [StreamingPlatform.APPLE_MUSIC]: { text: 'Apple', color: 'bg-red-500' },
      [StreamingPlatform.YOUTUBE]: { text: 'YouTube', color: 'bg-red-600' }
    };
    return badges[platform];
  };

  return (
    <div className="space-y-2">
      {results.map(track => {
        const badge = getPlatformBadge(track.platform);
        return (
          <div
            key={`${track.platform}-${track.id}`}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer"
            onClick={() => onPlay(track)}
          >
            <img
              src={track.coverUrl}
              alt={track.title}
              className="w-12 h-12 rounded"
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{track.title}</div>
              <div className="text-sm text-white/60 truncate">{track.artist}</div>
            </div>
            <span className={`text-xs px-2 py-1 rounded ${badge.color} text-white`}>
              {badge.text}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToQueue(track);
              }}
              className="p-2 hover:bg-white/10 rounded"
            >
              +
            </button>
          </div>
        );
      })}
    </div>
  );
};
```

## 6. 配置和环境变量

```env
# .env
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/callback

VITE_APPLE_MUSIC_DEVELOPER_TOKEN=your_apple_music_token

VITE_YOUTUBE_API_KEY=your_youtube_api_key
```

## 7. 注意事项

### 7.1 法律和许可

- 确保遵守各平台的服务条款
- Spotify 和 Apple Music 需要用户付费订阅
- 不要尝试下载或缓存受保护的内容

### 7.2 性能优化

- 懒加载 SDK（仅在需要时加载）
- 实现播放器预加载机制
- 缓存搜索结果

### 7.3 错误处理

- 处理网络错误
- 处理认证失败
- 处理播放限制（如地区限制）

### 7.4 用户体验

- 显示平台状态（已连接/未连接）
- 提供清晰的错误消息
- 实现无缝平台切换

## 8. 下一步

1. 实现基础的 Spotify 集成
2. 添加 YouTube 支持（最简单）
3. 集成 Apple Music（需要后端支持）
4. 优化 UI 和用户体验
5. 添加播放列表同步功能

## 参考资源

- [Spotify Web Playback SDK](https://developer.spotify.com/documentation/web-playback-sdk)
- [Apple MusicKit JS](https://developer.apple.com/documentation/musickitjs)
- [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference)
