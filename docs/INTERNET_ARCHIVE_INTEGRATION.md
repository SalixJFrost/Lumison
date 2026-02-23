# Internet Archive 集成指南

## 概述

Internet Archive 提供：
- 合法访问公共领域和 CC 授权内容
- 直接文件 URL，无 DRM
- 公开 API，无需认证
- 多种格式支持（MP3、FLAC、OGG）

## 架构

### 核心组件

1. **InternetArchivePlayer** - 播放器实现
2. **InternetArchiveService** - API 服务
3. **useInternetArchiveSearch** - React Hook

## 使用示例

### 基础搜索

```typescript
import { useInternetArchiveSearch } from '../hooks/useInternetArchiveSearch';

function SearchComponent() {
  const { results, isLoading, search } = useInternetArchiveSearch();

  const handleSearch = async () => {
    await search('jazz piano', {
      collection: 'opensource_audio',
      limit: 20
    });
  };

  return (
    <div>
      <button onClick={handleSearch}>搜索</button>
      {results.map(track => (
        <div key={track.id}>
          <h3>{track.title}</h3>
          <p>{track.artist}</p>
        </div>
      ))}
    </div>
  );
}
```

### 使用 StreamingManager

```typescript
import { getStreamingManager } from '../services/streaming/StreamingManager';
import { StreamingPlatform } from '../services/streaming/types';

const manager = getStreamingManager();
await manager.initializePlatform(StreamingPlatform.INTERNET_ARCHIVE, {});

const results = await manager.search('beethoven', {
  platforms: [StreamingPlatform.INTERNET_ARCHIVE],
  limit: 10
});

const tracks = results.get(StreamingPlatform.INTERNET_ARCHIVE);
if (tracks && tracks.length > 0) {
  await manager.play(tracks[0]);
}
```

### 直接 API 使用

```typescript
import { searchArchive, fetchArchiveMetadata, getBestAudioFile } from '../services/streaming/archive';

const items = await searchArchive({
  query: 'classical music',
  collection: 'opensource_audio',
  limit: 10
});

const metadata = await fetchArchiveMetadata(items[0].identifier);
const audioFile = getBestAudioFile(metadata);
```

## API 参考

### 搜索 API

```
https://archive.org/advancedsearch.php?q=QUERY&fl[]=FIELDS&rows=LIMIT&output=json
```

**查询示例：**
- `collection:(opensource_audio) AND format:(MP3) AND title:(jazz)`
- `creator:(mozart) AND format:(FLAC)`

### 元数据 API

```
https://archive.org/metadata/{identifier}
```

返回文件列表、元数据等。

### 下载 URL

```
https://archive.org/download/{identifier}/{filename}
```

直接 HTTP 访问，无需认证。

## 热门收藏集

| ID | 描述 |
|----|------|
| `opensource_audio` | 开源音频 |
| `etree` | 现场音乐档案 |
| `GratefulDead` | Grateful Dead |
| `audio_podcast` | 播客 |
| `librivoxaudio` | 有声书 |

## 最佳实践

### 1. 带宽考虑

```typescript
// 添加合理延迟
await new Promise(resolve => setTimeout(resolve, 100));

// 缓存元数据
const cache = new Map<string, ArchiveMetadata>();
```

### 2. 错误处理

```typescript
try {
  const metadata = await fetchArchiveMetadata(identifier);
  if (!metadata) {
    console.error('无元数据');
    return;
  }
  const audioFile = getBestAudioFile(metadata);
  if (!audioFile) {
    console.error('无音频文件');
    return;
  }
} catch (error) {
  console.error('获取失败:', error);
}
```

### 3. 授权归属

```typescript
function TrackCard({ track }) {
  return (
    <div>
      <h3>{track.title}</h3>
      <a href={track.uri} target="_blank">
        在 Internet Archive 查看
      </a>
    </div>
  );
}
```

## 与 YouTube 对比

| 特性 | YouTube | Internet Archive |
|------|---------|------------------|
| DRM | 有 | 无 |
| 直接 URL | 否 | 是 |
| 合法性 | 受限 | 完全合法 |
| API 访问 | 有限 | 完全公开 |
| 内容类型 | 商业音乐 | 公共领域/CC |

## 故障排除

### 无音频文件

```typescript
const metadata = await fetchArchiveMetadata(identifier);
if (!metadata || metadata.audioFiles.length === 0) {
  console.log('此项目无音频文件');
}
```

### 加载缓慢

```typescript
// 实现分页
const BATCH_SIZE = 5;
for (let i = 0; i < items.length; i += BATCH_SIZE) {
  const batch = items.slice(i, i + BATCH_SIZE);
  await Promise.all(batch.map(item => fetchArchiveMetadata(item.identifier)));
}
```

## 资源

- [API 文档](https://archive.org/services/docs/api/)
- [高级搜索](https://archive.org/advancedsearch.php)
- [收藏集浏览](https://archive.org/details/audio)
