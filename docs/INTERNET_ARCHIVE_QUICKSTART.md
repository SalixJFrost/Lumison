# Internet Archive 快速开始

5 分钟开始使用 Internet Archive 音频流。

## 步骤 1: 初始化

```typescript
import { getStreamingManager } from './services/streaming/StreamingManager';
import { StreamingPlatform } from './services/streaming/types';

const manager = getStreamingManager();
await manager.initializePlatform(StreamingPlatform.INTERNET_ARCHIVE, {});
```

## 步骤 2: 搜索

```typescript
const results = await manager.search('jazz piano', {
  platforms: [StreamingPlatform.INTERNET_ARCHIVE],
  limit: 10
});

const tracks = results.get(StreamingPlatform.INTERNET_ARCHIVE);
```

## 步骤 3: 播放

```typescript
if (tracks && tracks.length > 0) {
  await manager.play(tracks[0]);
}
```

## 步骤 4: 控制播放

```typescript
await manager.pause();      // 暂停
await manager.resume();     // 继续
await manager.seek(30);     // 跳转到 30 秒
await manager.setVolume(0.5); // 音量 50%
```

## 步骤 5: 监听事件

```typescript
import { StreamingPlayerEvent } from './services/streaming/types';

manager.on(StreamingPlayerEvent.PLAYING, (data) => {
  console.log('正在播放:', data.data.title);
});

manager.on(StreamingPlayerEvent.ENDED, () => {
  console.log('播放结束');
});
```

## 完整示例

```typescript
import { getStreamingManager } from './services/streaming/StreamingManager';
import { StreamingPlatform, StreamingPlayerEvent } from './services/streaming/types';

async function playMusic() {
  const manager = getStreamingManager();
  await manager.initializePlatform(StreamingPlatform.INTERNET_ARCHIVE, {});
  
  manager.on(StreamingPlayerEvent.PLAYING, (data) => {
    console.log('播放:', data.data.title);
  });
  
  const results = await manager.search('beethoven', {
    platforms: [StreamingPlatform.INTERNET_ARCHIVE],
    limit: 5
  });
  
  const tracks = results.get(StreamingPlatform.INTERNET_ARCHIVE);
  if (tracks && tracks.length > 0) {
    await manager.play(tracks[0]);
  }
}

playMusic();
```

## 使用 React Hook

```typescript
import { useInternetArchiveSearch } from './hooks/useInternetArchiveSearch';

function MyPlayer() {
  const { results, isLoading, search } = useInternetArchiveSearch();
  
  return (
    <div>
      <button onClick={() => search('jazz')}>搜索</button>
      {results.map(track => (
        <div key={track.id}>{track.title}</div>
      ))}
    </div>
  );
}
```

## 使用 UI 组件

```typescript
import { InternetArchiveSearch } from './components/InternetArchiveSearch';

function App() {
  const handleSelect = async (track) => {
    const manager = getStreamingManager();
    await manager.play(track);
  };
  
  return <InternetArchiveSearch onTrackSelect={handleSelect} />;
}
```

## 热门收藏集

- `opensource_audio` - 开源音频
- `etree` - 现场音乐档案
- `GratefulDead` - Grateful Dead
- `audio_podcast` - 播客
- `librivoxaudio` - 有声书

## 提示

1. **无需 API Key** - 无需认证
2. **直接 URL** - HTTP 直接访问
3. **合法内容** - 公共领域或 CC 授权
4. **带宽** - Internet Archive 是非营利组织，请合理使用
5. **缓存** - 考虑缓存元数据

## 故障排除

**无搜索结果？** 尝试不同关键词或收藏集

**播放失败？** 检查浏览器控制台错误

**加载缓慢？** 实现分页和缓存
