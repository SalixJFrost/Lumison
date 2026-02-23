# Internet Archive 音频集成

合法、无 DRM 的音频流媒体解决方案，来自 archive.org。

## 快速开始

### 1. 初始化平台

```typescript
import { getStreamingManager } from './services/streaming/StreamingManager';
import { StreamingPlatform } from './services/streaming/types';

const manager = getStreamingManager();
await manager.initializePlatform(StreamingPlatform.INTERNET_ARCHIVE, {});
```

### 2. 搜索音频

```typescript
const results = await manager.search('jazz piano', {
  platforms: [StreamingPlatform.INTERNET_ARCHIVE],
  limit: 10
});

const tracks = results.get(StreamingPlatform.INTERNET_ARCHIVE);
```

### 3. 播放音乐

```typescript
if (tracks && tracks.length > 0) {
  await manager.play(tracks[0]);
}
```

## 使用 React Hook

```typescript
import { useInternetArchiveSearch } from './hooks/useInternetArchiveSearch';

function MyComponent() {
  const { results, isLoading, search } = useInternetArchiveSearch();
  
  const handleSearch = async () => {
    await search('classical music', {
      collection: 'opensource_audio',
      limit: 20
    });
  };
  
  return (
    <div>
      <button onClick={handleSearch}>搜索</button>
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
  const handleTrackSelect = async (track) => {
    const manager = getStreamingManager();
    await manager.play(track);
  };
  
  return <InternetArchiveSearch onTrackSelect={handleTrackSelect} />;
}
```

## 架构

```
UI 组件 (InternetArchiveSearch)
    ↓
React Hook (useInternetArchiveSearch)
    ↓
StreamingManager (平台管理)
    ↓
InternetArchivePlayer (播放器)
    ↓
InternetArchiveService (API 服务)
    ↓
Internet Archive API
```

## 核心文件

- `src/services/streaming/archive/InternetArchivePlayer.ts` - 播放器实现
- `src/services/streaming/archive/InternetArchiveService.ts` - API 工具
- `src/hooks/useInternetArchiveSearch.ts` - React Hook
- `src/components/InternetArchiveSearch.tsx` - UI 组件

## API 端点

1. **搜索**: `https://archive.org/advancedsearch.php`
2. **元数据**: `https://archive.org/metadata/{identifier}`
3. **下载**: `https://archive.org/download/{identifier}/{filename}`

## 热门收藏集

```typescript
import { POPULAR_COLLECTIONS } from './services/streaming/archive';

// 可用收藏集：
// - opensource_audio (开源音频)
// - etree (现场音乐档案)
// - GratefulDead (Grateful Dead)
// - audio_podcast (播客)
// - librivoxaudio (有声书)
```

## 优势

✅ **合法** - 公共领域和 CC 授权内容  
✅ **无需 API Key** - 无需认证  
✅ **无 DRM** - 直接文件访问  
✅ **永久 URL** - 链接不过期  
✅ **免费** - 无配额限制  

## 与 YouTube 对比

| 特性 | YouTube | Internet Archive |
|------|---------|------------------|
| 合法性 | ❌ 违反 ToS | ✅ 完全合法 |
| API Key | ✅ 需要 | ✅ 不需要 |
| DRM | ❌ 有 | ✅ 无 |
| 直链 | ❌ 否 | ✅ 是 |

## 完整示例

查看 `examples/internet-archive-integration-example.tsx` 获取完整代码示例。

## 详细文档

- [快速开始](./INTERNET_ARCHIVE_QUICKSTART.md) - 5 分钟入门
- [集成指南](./INTERNET_ARCHIVE_INTEGRATION.md) - 完整集成说明

## 测试

```bash
npm test -- InternetArchiveService
```

## 注意事项

1. **带宽** - Internet Archive 是非营利组织，请合理使用
2. **归属** - 始终链接回 archive.org
3. **缓存** - 考虑缓存元数据以减少 API 调用
4. **格式** - 优先使用 MP3 以获得最佳兼容性

## 故障排除

**搜索无结果？**
- 尝试不同的关键词
- 检查收藏集 ID
- 某些收藏集可能音频内容有限

**播放失败？**
- 检查浏览器控制台错误
- 验证音频 URL 可访问
- 某些旧项目可能有格式问题

**加载缓慢？**
- 实现元数据缓存
- 为大结果集添加分页
- 考虑缓存常访问项目
