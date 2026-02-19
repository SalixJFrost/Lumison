# 本地音乐歌词问题调试

## 问题描述
本地导入的音乐没有显示歌词，即使已经实现了从网易云API获取歌词的功能。

## 代码流程分析

### 1. 本地文件导入 (usePlaylist.ts - addLocalFiles)
```typescript
// 本地导入时的设置
newSongs.push({
  id: `local-${Date.now()}-${i}`,
  title,
  artist,
  fileUrl: url,
  coverUrl,
  lyrics: [], // 空数组
  needsLyricsMatch: true, // 标记需要在线匹配
  localLyrics: localLyrics.length > 0 ? localLyrics : embeddedLyrics.length > 0 ? embeddedLyrics : undefined,
});
```

### 2. 歌词匹配触发 (usePlayer.ts)
```typescript
useEffect(() => {
  if (!currentSong) return;
  
  const needsLyricsMatch = currentSong.needsLyricsMatch;
  const existingLyrics = currentSong.lyrics ?? [];
  
  // 如果已有歌词，直接成功
  if (existingLyrics.length > 0) {
    markMatchSuccess();
    return;
  }
  
  // 如果不需要匹配，标记失败
  if (!needsLyricsMatch) {
    markMatchFailed();
    return;
  }
  
  // 执行在线搜索
  const fetchLyrics = async () => {
    setMatchStatus("matching");
    const result = await searchAndMatchLyrics(songTitle, songArtist);
    if (result) {
      updateSongInQueue(songId, {
        lyrics: mergeLyricsWithMetadata(result),
        needsLyricsMatch: false,
      });
      markMatchSuccess();
    } else {
      // 失败时使用本地歌词
      if (currentSong.localLyrics) {
        updateSongInQueue(songId, {
          lyrics: currentSong.localLyrics,
          needsLyricsMatch: false,
        });
        markMatchSuccess();
      } else {
        markMatchFailed();
      }
    }
  };
  
  fetchLyrics();
}, [currentSong?.id]);
```

### 3. 在线搜索 (lyricsService.ts - searchAndMatchLyrics)
```typescript
export const searchAndMatchLyrics = async (title: string, artist: string) => {
  // 1. 优先使用多平台搜索（网易云 > QQ > 酷狗）
  const multiPlatformResult = await multiPlatformSearch(title, artist);
  if (multiPlatformResult) {
    return {
      lrc: multiPlatformResult.lrc,
      yrc: multiPlatformResult.yrc,
      tLrc: multiPlatformResult.tLrc,
      metadata: multiPlatformResult.metadata,
    };
  }
  
  // 2. 如果失败，尝试专门的歌词API
  const dedicatedResult = await searchDedicatedLyricsAPIs(title, artist);
  if (dedicatedResult) {
    return {
      lrc: dedicatedResult.lrc,
      metadata: dedicatedResult.metadata,
    };
  }
  
  return null;
};
```

### 4. 多平台搜索 (multiPlatformLyrics.ts)
```typescript
export const searchAndFetchLyrics = async (title: string, artist: string) => {
  const keyword = `${title} ${artist}`;
  
  // 同时请求所有平台
  const searchPromises = [
    // 网易云音乐（优先）
    searchNeteaseMusic(keyword).then(song => 
      song?.id ? fetchNeteaseMusicLyrics(song.id) : null
    ),
    // QQ音乐
    searchQQMusic(keyword).then(song => 
      song?.songmid ? fetchQQMusicLyrics(song.songmid) : null
    ),
    // 酷狗音乐
    searchKugouMusic(keyword).then(song => 
      song?.FileHash ? fetchKugouMusicLyrics(song.FileHash) : null
    ),
  ];
  
  // 优先返回网易云的结果
  const results = await Promise.allSettled(searchPromises);
  const neteaseResult = results[0].status === 'fulfilled' ? results[0].value : null;
  if (neteaseResult) return neteaseResult;
  
  // 否则返回任何成功的结果
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      return result.value;
    }
  }
  
  return null;
};
```

## 可能的问题

### 1. ✅ 代码逻辑正确
- 本地导入时正确设置了 `needsLyricsMatch: true`
- useEffect 会在歌曲切换时触发歌词匹配
- 优先使用网易云API，失败时回退到本地歌词

### 2. ⚠️ 可能的网络问题
- API请求可能被CORS阻止
- API服务器可能不可用
- 代理服务可能有问题

### 3. ⚠️ 可能的搜索问题
- 歌曲标题/艺术家名称可能不准确
- 搜索关键词可能无法匹配到结果

## 调试建议

### 1. 检查浏览器控制台
打开浏览器开发者工具，查看：
- 是否有网络请求错误
- 是否有CORS错误
- 是否有API返回错误
- 查看日志输出：
  - "Using multi-platform lyrics search..."
  - "Trying Netease Music..."
  - "✓ Found lyrics on Netease Music"
  - "Online search failed, using local lyrics as fallback"

### 2. 检查网络请求
在Network标签中查看：
- 是否有对网易云/QQ/酷狗API的请求
- 请求是否成功（状态码200）
- 响应内容是否包含歌词数据

### 3. 测试特定歌曲
尝试导入一首知名歌曲（如"告白气球 - 周杰伦"），看是否能获取到歌词

### 4. 检查代理服务
查看 `src/services/utils.ts` 中的 `fetchViaProxy` 函数是否正常工作

## 建议的改进

### 1. 添加更详细的日志
在关键位置添加console.log，追踪歌词获取流程

### 2. 添加重试机制
如果第一次搜索失败，可以尝试不同的搜索关键词组合

### 3. 添加用户反馈
在UI上显示歌词匹配状态（匹配中/成功/失败）

### 4. 优化搜索关键词
- 移除括号中的内容（如"(Live版)"）
- 移除特殊字符
- 尝试只用歌曲名搜索（不带艺术家）

## 测试步骤

1. 导入一首本地音乐文件
2. 打开浏览器开发者工具
3. 播放音乐
4. 观察控制台日志和网络请求
5. 检查歌词是否显示

## 当前状态

✅ 代码实现完整
✅ 优先使用网易云API
✅ 支持多平台搜索
✅ 有本地歌词回退机制
⚠️ 需要实际测试验证功能是否正常工作
