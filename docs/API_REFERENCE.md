# Lumison API 参考文档

本文档列出了 Lumison 项目中所有可用的 API、服务和工具函数。

## 目录

- [音乐服务 (Music Services)](#音乐服务)
- [歌词服务 (Lyrics Services)](#歌词服务)
- [流媒体服务 (Streaming Services)](#流媒体服务)
- [工具函数 (Utilities)](#工具函数)
- [UI 服务 (UI Services)](#ui-服务)
- [更新服务 (Update Service)](#更新服务)

---

## 音乐服务

### 网易云音乐 API (扩展版)

新的扩展 API 提供了更完整的网易云音乐功能。导入方式：

```typescript
import neteaseApi from '@/services/music/neteaseApi';
// 或单独导入
import { searchSongs, getSongDetail, getLyric } from '@/services/music/neteaseApi';
```

#### 搜索 API

##### `searchSongs(keyword: string, options?): Promise<{ songs: NeteaseTrack[]; songCount: number }>`
搜索歌曲。

**参数：**
- `keyword`: 搜索关键词
- `options`: 可选配置
  - `limit`: 返回结果数量（默认 30）
  - `offset`: 分页偏移量（默认 0）

**示例：**
```typescript
const { songs, songCount } = await neteaseApi.searchSongs('周杰伦', { limit: 20 });
console.log(`找到 ${songCount} 首歌曲`);
```

---

##### `searchPlaylists(keyword: string, options?): Promise<{ playlists: NeteasePlaylist[]; playlistCount: number }>`
搜索歌单。

---

##### `searchAlbums(keyword: string, options?): Promise<{ albums: NeteaseAlbum[]; albumCount: number }>`
搜索专辑。

---

##### `searchArtists(keyword: string, options?): Promise<{ artists: NeteaseArtist[]; artistCount: number }>`
搜索歌手。

---

#### 歌曲详情 API

##### `getSongDetail(ids: number | number[]): Promise<NeteaseTrack[]>`
获取歌曲详情（支持批量）。

**示例：**
```typescript
// 单首歌曲
const [song] = await neteaseApi.getSongDetail(123456);

// 多首歌曲
const songs = await neteaseApi.getSongDetail([123456, 789012]);
```

---

##### `getSongUrl(id: number, quality?): Promise<{ url: string; br: number; size: number } | null>`
获取歌曲播放 URL。

**音质选项：**
- `'standard'`: 标准音质 (128kbps)
- `'higher'`: 较高音质 (320kbps) - 默认
- `'exhigh'`: 极高音质 (320kbps)
- `'lossless'`: 无损音质 (FLAC)

**示例：**
```typescript
const urlData = await neteaseApi.getSongUrl(123456, 'lossless');
if (urlData) {
  console.log('播放地址:', urlData.url);
  console.log('比特率:', urlData.br);
}
```

---

##### `getLyric(id: number): Promise<NeteaseLyric>`
获取歌词（包括原文、翻译、罗马音、逐字歌词）。

**返回：**
```typescript
{
  lrc?: { lyric: string };      // 原文歌词
  tlyric?: { lyric: string };   // 翻译歌词
  romalrc?: { lyric: string };  // 罗马音歌词
  yrc?: { lyric: string };      // 逐字歌词
}
```

---

#### 歌单 API

##### `getPlaylistDetail(id: number): Promise<{ playlist: NeteasePlaylist; tracks: NeteaseTrack[] }>`
获取歌单详情和曲目列表。

---

##### `getRecommendPlaylists(limit?: number): Promise<NeteasePlaylist[]>`
获取推荐歌单。

---

##### `getTopPlaylists(category?, options?): Promise<{ playlists: NeteasePlaylist[]; total: number }>`
获取精品歌单。

**分类：** 全部、华语、欧美、日语、韩语、粤语、小语种、流行、摇滚、民谣、电子、舞曲、说唱、轻音乐、爵士、乡村、R&B/Soul、古典、民族、英伦、金属、朋克、蓝调、雷鬼、世界音乐、拉丁、另类/独立、New Age、古风、后摇、Bossa Nova

---

#### 专辑 API

##### `getAlbumDetail(id: number): Promise<{ album: NeteaseAlbum; songs: NeteaseTrack[] }>`
获取专辑详情和歌曲列表。

---

##### `getNewAlbums(options?): Promise<NeteaseAlbum[]>`
获取最新专辑。

**地区选项：** ALL, ZH, EA, KR, JP

---

#### 歌手 API

##### `getArtistDetail(id: number): Promise<NeteaseArtist>`
获取歌手详情。

---

##### `getArtistTopSongs(id: number): Promise<NeteaseTrack[]>`
获取歌手热门歌曲（Top 50）。

---

##### `getArtistAlbums(id: number, options?): Promise<{ albums: NeteaseAlbum[]; more: boolean }>`
获取歌手专辑列表。

---

#### 排行榜 API

##### `getToplistDetail(): Promise<any[]>`
获取所有排行榜列表。

**包含：**
- 飙升榜
- 新歌榜
- 热歌榜
- 原创榜
- 各国家/地区榜单

---

##### `getToplist(id: number): Promise<{ playlist: NeteasePlaylist; tracks: NeteaseTrack[] }>`
获取指定排行榜内容。

**常用榜单 ID：**
- 飙升榜: 19723756
- 新歌榜: 3779629
- 热歌榜: 3778678
- 原创榜: 2884035

---

#### 评论 API

##### `getSongComments(id: number, options?): Promise<{ comments: NeteaseComment[]; total: number; hotComments: NeteaseComment[] }>`
获取歌曲评论。

**选项：**
- `limit`: 数量限制
- `offset`: 偏移量
- `type`: 'hot' | 'new' - 热门或最新

---

#### 推荐 API

##### `getDailyRecommendSongs(): Promise<NeteaseTrack[]>`
获取每日推荐歌曲（需要登录）。

---

##### `getSimilarSongs(id: number, limit?: number): Promise<NeteaseTrack[]>`
获取相似歌曲推荐。

---

##### `getSimilarPlaylists(id: number, limit?: number): Promise<NeteasePlaylist[]>`
获取相似歌单推荐。

---

#### 其他 API

##### `getHotSearchList(): Promise<Array<{ searchWord: string; score: number }>>`
获取热搜榜。

---

##### `getSearchSuggest(keyword: string): Promise<SearchSuggest>`
获取搜索建议（输入提示）。

---

##### `checkMusicAvailable(id: number): Promise<{ success: boolean; message: string }>`
检查音乐是否可用（版权检查）。

---

#### 便捷函数

##### `quickSearchSong(keyword: string): Promise<NeteaseTrack | null>`
快速搜索并返回第一首歌曲。

---

##### `getCompleteSongInfo(id: number): Promise<CompleteSongInfo>`
一次性获取歌曲的完整信息（详情、播放URL、歌词）。

**示例：**
```typescript
const { detail, url, lyric } = await neteaseApi.getCompleteSongInfo(123456);
console.log('歌曲:', detail.name);
console.log('播放地址:', url);
console.log('歌词:', lyric.lrc?.lyric);
```

---

### 网易云音乐 API (原版)

原有的简化 API 仍然可用，位于 `lyricsService.ts`。

#### `searchNetEase(keyword: string, options?: SearchOptions): Promise<NeteaseTrackInfo[]>`
搜索网易云音乐。

**参数：**
- `keyword`: 搜索关键词
- `options`: 可选配置
  - `limit`: 返回结果数量（默认 20）
  - `offset`: 分页偏移量（默认 0）

**返回：** 歌曲信息数组

**示例：**
```typescript
const results = await searchNetEase('周杰伦', { limit: 10 });
```

---

#### `fetchNeteaseSong(songId: string): Promise<NeteaseTrackInfo | null>`
根据 ID 获取网易云音乐歌曲信息。

**参数：**
- `songId`: 歌曲 ID

**返回：** 歌曲信息或 null

---

#### `fetchNeteasePlaylist(playlistId: string): Promise<NeteaseTrackInfo[]>`
获取网易云音乐歌单。

**参数：**
- `playlistId`: 歌单 ID

**返回：** 歌曲列表

---

#### `getNeteaseAudioUrl(id: string): string`
获取网易云音乐播放 URL。

**参数：**
- `id`: 歌曲 ID

**返回：** 播放 URL

---

### 音频流服务

#### `fetchAudioFromUrl(url: string): Promise<{ track: AudioStreamTrackInfo | null; error?: AudioStreamError }>`
从 URL 获取音频信息（支持 Internet Archive 和直链）。

**支持的 URL 格式：**
- Internet Archive: `https://archive.org/details/[identifier]`
- 直链音频: `https://example.com/audio.mp3`

**返回：** 包含音频信息和可能的错误

**示例：**
```typescript
const { track, error } = await fetchAudioFromUrl('https://archive.org/details/example');
if (track) {
  console.log('Title:', track.title);
}
```

---

#### `parseInternetArchiveUrl(url: string): string | null`
解析 Internet Archive URL，提取 identifier。

---

#### `validateSelfHostedAudio(url: string): Promise<AudioStreamTrackInfo | null>`
验证并获取自托管音频文件信息。

---

### Gemini AI 分析

#### `analyzeLyrics(title: string, artist: string, lyrics: string): Promise<any>`
使用 Gemini AI 分析歌词。

**参数：**
- `title`: 歌曲标题
- `artist`: 艺术家
- `lyrics`: 歌词内容

**返回：** AI 分析结果

---

## 歌词服务

### 多平台歌词搜索

#### `searchAndFetchLyrics(title: string, artist: string): Promise<LyricResult>`
从多个平台搜索并获取歌词（网易云、QQ音乐、酷狗）。

**策略：** 同时请求所有平台，优先返回网易云结果。

**参数：**
- `title`: 歌曲标题
- `artist`: 艺术家

**返回：** 歌词结果

**示例：**
```typescript
const result = await searchAndFetchLyrics('稻香', '周杰伦');
console.log('Lyrics:', result.lrc);
console.log('Translation:', result.tLrc);
```

---

#### `fetchLyricsByPlatform(platform: "qq" | "kugou" | "netease", id: string): Promise<LyricResult>`
根据平台 ID 直接获取歌词。

---

#### `fetchLyricsById(songId: string): Promise<LyricData | null>`
根据网易云歌曲 ID 获取歌词。

**返回：**
```typescript
{
  lrc: string;        // 原文歌词
  yrc?: string;       // 逐字歌词
  tLrc?: string;      // 翻译歌词
  metadata: string[]; // 元数据
}
```

---

### 歌词解析

#### `parseLyrics(lrcContent: string, translationContent?: string): LyricLine[]`
解析 LRC 格式歌词。

**功能：**
- 解析时间标签
- 解析逐字歌词（YRC 格式）
- 合并翻译
- 插入间奏标记
- 过滤元数据

**返回：** 歌词行数组

---

#### `mergeTranslations(lines: LyricLine[], translationContent?: string): LyricLine[]`
将翻译合并到歌词行。

---

### 歌词工具

#### `normalizeTimeKey(time: number): number`
标准化时间键，用于 Map 查找。

---

#### `isMetadataLine(text: string): boolean`
检查文本是否为元数据行。

---

## 流媒体服务

### StreamingManager

统一的流媒体平台管理器。

#### `getStreamingManager(): StreamingManager`
获取 StreamingManager 单例实例。

---

#### `initializePlatform(platform: StreamingPlatform, config: StreamingPlayerConfig): Promise<void>`
初始化流媒体平台。

**支持的平台：**
- `StreamingPlatform.YOUTUBE`
- `StreamingPlatform.SPOTIFY` (待实现)
- `StreamingPlatform.APPLE_MUSIC` (待实现)

**示例：**
```typescript
const manager = getStreamingManager();
await manager.initializePlatform(StreamingPlatform.YOUTUBE, {
  apiKey: 'YOUR_YOUTUBE_API_KEY'
});
```

---

#### `play(track: StreamingTrack): Promise<void>`
播放流媒体曲目。

---

#### `search(query: string, options: StreamingSearchOptions): Promise<Map<StreamingPlatform, StreamingTrack[]>>`
跨平台搜索。

**示例：**
```typescript
const results = await manager.search('周杰伦', {
  platforms: [StreamingPlatform.YOUTUBE],
  limit: 20
});
```

---

### YouTubePlayer

YouTube IFrame Player 实现。

**方法：**
- `initialize(config)`: 初始化播放器
- `play(track)`: 播放视频
- `pause()`: 暂停
- `resume()`: 继续
- `seek(position)`: 跳转
- `setVolume(volume)`: 设置音量
- `search(query)`: 搜索视频

---

## 工具函数

### 时间格式化

#### `formatTime(seconds: number): string`
将秒数格式化为 MM:SS 格式。

**示例：**
```typescript
formatTime(125); // "2:05"
```

---

### 数组工具

#### `shuffleArray<T>(array: T[]): T[]`
随机打乱数组。

---

### 网络请求

#### `fetchViaProxy(targetUrl: string): Promise<any>`
通过 CORS 代理获取资源。

**策略：** 先尝试直接请求，失败则使用代理。

---

### URL 解析

#### `parseNeteaseLink(input: string): { type: "song" | "playlist"; id: string } | null`
解析网易云音乐链接。

**支持格式：**
- `https://music.163.com/#/song?id=123456`
- `https://music.163.com/#/playlist?id=123456`

---

### 音频元数据

#### `parseAudioMetadata(file: File): Promise<AudioMetadata>`
解析音频文件元数据（使用 jsmediatags）。

**返回：**
```typescript
{
  title?: string;
  artist?: string;
  album?: string;
  year?: string;
  picture?: string; // Base64 图片
}
```

---

### 颜色提取

#### `extractColors(imageSrc: string): Promise<string[]>`
从图片提取主色调（使用 ColorThief）。

**返回：** RGB 颜色数组

---

### 音频格式检测

#### `canPlayAudioFormat(mimeType: string): boolean`
检查浏览器是否支持特定音频格式。

---

#### `getSupportedAudioFormats(): Record<string, boolean>`
获取所有支持的音频格式。

**返回：**
```typescript
{
  mp3: true,
  flac: true,
  wav: true,
  // ...
}
```

---

#### `isFormatLikelySupported(filename: string): boolean`
根据文件扩展名判断是否可能支持。

---

### 流式播放

#### `isStreamingSupported(): boolean`
检查浏览器是否支持 MediaSource 流式播放。

---

#### `getBestStreamingMethod(url: string, onProgress?: Function): Promise<string>`
获取最佳流式播放方法。

**返回：** Blob URL

---

## UI 服务

### 键盘注册表

#### `keyboardRegistry`
全局键盘快捷键注册表。

**方法：**
- `register(scope, priority, handler)`: 注册快捷键
- `unregister(scope)`: 注销快捷键
- `handleKeyDown(event)`: 处理按键事件

**示例：**
```typescript
import { keyboardRegistry } from '@/services/ui/keyboardRegistry';

keyboardRegistry.register('myScope', 100, (e) => {
  if (e.key === 'Enter') {
    console.log('Enter pressed');
    return true; // 阻止事件传播
  }
  return false;
});
```

---

## 更新服务

### UpdateService

应用自动更新服务（Tauri）。

#### `checkForUpdates(): Promise<UpdateInfo | null>`
检查更新。

---

#### `installUpdate(): Promise<void>`
安装更新。

---

## 类型定义

### 音乐相关

```typescript
interface NeteaseTrackInfo {
  id: string;
  neteaseId: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  duration: number;
}

interface LyricLine {
  time: number;
  text: string;
  translation?: string;
  words?: LyricWord[];
  isInterlude?: boolean;
  isMetadata?: boolean;
}

interface LyricWord {
  text: string;
  startTime: number;
  endTime: number;
}
```

### 流媒体相关

```typescript
enum StreamingPlatform {
  SPOTIFY = 'spotify',
  APPLE_MUSIC = 'apple_music',
  YOUTUBE = 'youtube',
  NETEASE = 'netease',
  LOCAL = 'local'
}

interface StreamingTrack {
  id: string;
  platform: StreamingPlatform;
  title: string;
  artist: string;
  album?: string;
  coverUrl: string;
  duration: number;
  uri?: string;
  url?: string;
}
```

---

## 使用示例

### 完整的音乐播放流程

```typescript
import { searchNetEase, getNeteaseAudioUrl } from '@/services/music/lyricsService';
import { searchAndFetchLyrics } from '@/services/music/multiPlatformLyrics';
import { parseLyrics } from '@/services/lyrics/parser';

// 1. 搜索歌曲
const results = await searchNetEase('稻香');
const song = results[0];

// 2. 获取播放 URL
const audioUrl = getNeteaseAudioUrl(song.id);

// 3. 获取歌词
const lyricsData = await searchAndFetchLyrics(song.title, song.artist);

// 4. 解析歌词
const lyrics = parseLyrics(lyricsData.lrc, lyricsData.tLrc);

// 5. 播放
const audio = new Audio(audioUrl);
audio.play();
```

### 使用流媒体服务

```typescript
import { getStreamingManager, StreamingPlatform } from '@/services/streaming';

const manager = getStreamingManager();

// 初始化 YouTube
await manager.initializePlatform(StreamingPlatform.YOUTUBE, {
  apiKey: 'YOUR_API_KEY'
});

// 搜索
const results = await manager.search('周杰伦', {
  platforms: [StreamingPlatform.YOUTUBE],
  limit: 10
});

// 播放
const youtubeResults = results.get(StreamingPlatform.YOUTUBE);
if (youtubeResults && youtubeResults.length > 0) {
  await manager.play(youtubeResults[0]);
}
```

---

## 注意事项

1. **CORS 问题**: 某些 API 可能需要 CORS 代理
2. **API 限流**: 注意各平台的 API 调用限制
3. **错误处理**: 所有异步函数都应该使用 try-catch
4. **资源清理**: 使用完毕后记得清理资源（如 Blob URL）

---

## 相关文档

- [开发指南](DEVELOPMENT.md)
- [流媒体集成](STREAMING_INTEGRATION.md)
- [性能优化](PERFORMANCE_OPTIMIZATION.md)
