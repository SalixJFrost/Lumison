# 歌词 API 调用流程

## 触发时机
当播放器切换到新歌曲时，`usePlayer.ts` 中的 `useEffect` 会检查是否需要获取歌词。

## 调用流程

### 1. 检查条件 (usePlayer.ts)
```typescript
// 如果已有歌词，直接标记成功
if (existingLyrics.length > 0) {
  markMatchSuccess();
  return;
}

// 如果不需要匹配歌词，标记失败
if (!needsLyricsMatch) {
  markMatchFailed();
  return;
}
```

### 2. 分支处理

#### 分支 A: 网易云音乐歌曲
如果歌曲来自网易云（`isNetease === true` 且有 `neteaseId`）：

```
usePlayer.ts
  └─> fetchLyricsById(songNeteaseId)
       └─> lyricsService.ts: fetchLyricsById()
            └─> fetchWithFallback(`${API}/lyric/new?id=${songId}`)
                 ├─> 尝试 API 1: https://163api.qijieya.cn
                 ├─> 尝试 API 2: https://netease-cloud-music-api-psi-ten.vercel.app
                 └─> 尝试 API 3: https://music-api.heheda.top
```

**返回数据**:
- `lrc`: 标准 LRC 格式歌词
- `yrc`: 网易云逐字歌词（带单词级时间戳）
- `tLrc`: 翻译歌词
- `metadata`: 贡献者信息等元数据

#### 分支 B: 本地音乐文件
如果是本地上传的音乐文件：

```
usePlayer.ts
  └─> searchAndMatchLyrics(title, artist)
       └─> lyricsService.ts: searchAndMatchLyrics()
            ├─> 1. searchNetEase(`${title} ${artist}`, { limit: 5 })
            │    └─> fetchWithFallback(`${API}/cloudsearch?keywords=...`)
            │         ├─> 尝试 API 1: https://163api.qijieya.cn
            │         ├─> 尝试 API 2: https://netease-cloud-music-api-psi-ten.vercel.app
            │         └─> 尝试 API 3: https://music-api.heheda.top
            │
            └─> 2. fetchLyricsById(songs[0].id)
                 └─> (同上面的 fetchLyricsById 流程)
```

### 3. 网络请求层 (utils.ts)

每个 API 请求都会经过 `fetchWithFallback` → `fetchViaProxy`：

```
fetchViaProxy(targetUrl)
  ├─> 1. 尝试直接请求 (Direct CORS)
  │    └─> fetch(targetUrl, { mode: 'cors' })
  │
  └─> 2. 如果失败，尝试 CORS 代理
       ├─> Proxy 1: https://api.allorigins.win/raw?url=...
       └─> Proxy 2: https://corsproxy.io/?...
```

### 4. 歌词解析 (lyrics/index.ts)

获取到原始歌词数据后：

```
parseLyrics(lrc, tLrc, { yrcContent })
  ├─> 检测格式
  │    ├─> 是否为网易云 YRC 格式？
  │    └─> 是否为标准 LRC 格式？
  │
  ├─> 解析主歌词
  │    └─> netease.ts: parseNeteaseLyrics() 或
  │         lrc.ts: parseLrc()
  │
  ├─> 合并翻译
  │    └─> translation.ts: mergeTranslation()
  │
  └─> 返回 LyricLine[]
```

## API 端点优先级

### 主 API
1. `https://163api.qijieya.cn` (默认)

### 备用 API
2. `https://netease-cloud-music-api-psi-ten.vercel.app`
3. `https://music-api.heheda.top`

### CORS 代理
1. `https://api.allorigins.win/raw?url=...`
2. `https://corsproxy.io/?...`

## 超时设置
- 歌词请求超时: 8000ms (8秒)
- 定义在 `usePlayer.ts` 的 `MATCH_TIMEOUT_MS`

## 错误处理
如果所有 API 和代理都失败：
1. 控制台输出错误日志
2. 标记歌词匹配失败 (`matchStatus = "failed"`)
3. 显示 "纯音乐，请欣赏"

## 缓存机制
- 歌词获取成功后会保存到歌曲对象的 `lyrics` 字段
- 下次播放同一首歌时直接使用缓存，不再请求 API
