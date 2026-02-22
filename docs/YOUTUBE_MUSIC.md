# YouTube Music 集成

## 快速开始

### 1. 获取 API 密钥
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建项目并启用 YouTube Data API v3
3. 创建 API 密钥

### 2. 配置
```bash
# 创建 .env 文件
cp .env.example .env

# 添加 API 密钥
VITE_YOUTUBE_API_KEY=your_api_key_here
```

### 3. 更新 SearchModal.tsx

#### 添加导入
```typescript
import { YouTubeMusicSearchResult } from "../hooks/useYouTubeMusicSearchProvider";
```

#### 修改标签页（约第360行）
```typescript
{/* 三个标签 */}
<div className="relative flex items-center justify-center p-1 rounded-lg self-center w-full max-w-md mb-1 bg-black/20 backdrop-blur-md shadow-inner">
  <div
    className="absolute top-1 bottom-1 rounded-[6px] bg-white/15 shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
    style={{
      left: search.activeTab === "queue" ? "4px" : search.activeTab === "netease" ? "calc(33.33% + 2px)" : "calc(66.66%)",
      width: "calc(33.33% - 4px)",
    }}
  />
  <button onClick={() => search.setActiveTab("queue")} className={`relative flex-1 py-1.5 text-[13px] font-medium transition-colors duration-200 z-10 ${search.activeTab === "queue" ? "text-white" : "text-white/50 hover:text-white/70"}`}>
    {search.queueProvider.label}
  </button>
  <button onClick={() => search.setActiveTab("netease")} className={`relative flex-1 py-1.5 text-[13px] font-medium transition-colors duration-200 z-10 ${search.activeTab === "netease" ? "text-white" : "text-white/50 hover:text-white/70"}`}>
    {t("search.netease")}
  </button>
  <button onClick={() => search.setActiveTab("youtube")} className={`relative flex-1 py-1.5 text-[13px] font-medium transition-colors duration-200 z-10 ${search.activeTab === "youtube" ? "text-white" : "text-white/50 hover:text-white/70"}`}>
    {t("search.youtube")}
  </button>
</div>
```

#### 添加 YouTube 播放函数（约第260行）
```typescript
const playYouTubeTrack = (track: YouTubeMusicSearchResult) => {
  const song: Song = {
    id: track.id,
    title: track.title,
    artist: track.artist,
    coverUrl: track.coverUrl,
    fileUrl: track.fileUrl,
    isYouTube: true,
    youtubeId: track.youtubeId,
    album: track.album,
    lyrics: [],
    needsLyricsMatch: true,
  };
  onImportAndPlay(song);
};

const addYouTubeToQueue = (track: YouTubeMusicSearchResult) => {
  const song: Song = { ...playYouTubeTrack的参数 };
  onAddToQueue(song);
};
```

#### 更新 handleSelection（约第230行）
```typescript
const handleSelection = (index: number) => {
  if (search.activeTab === "queue") {
    const item = search.queueResults[index];
    if (item) {
      onPlayQueueIndex(item.i);
      onClose();
    }
  } else if (search.activeTab === "netease") {
    const track = search.neteaseProvider.results[index];
    if (track) {
      playNeteaseTrack(track);
      onClose();
    }
  } else if (search.activeTab === "youtube") {
    const track = search.youtubeResults[index];
    if (track) {
      playYouTubeTrack(track);
      onClose();
    }
  }
};
```

#### 更新键盘处理（约第190行）
```typescript
case "Enter": {
  e.preventDefault();
  if (search.selectedIndex >= 0) {
    handleSelection(search.selectedIndex);
  } else if (search.activeTab === "netease" && search.query.trim()) {
    search.performNeteaseSearch();
  } else if (search.activeTab === "youtube" && search.query.trim()) {
    search.performYouTubeSearch();
  }
  return true;
}
```

#### 添加 YouTube 结果区域（在 Netease Results 后面）
```typescript
{/* YouTube Results */}
{search.activeTab === "youtube" && (
  <div className="relative flex flex-col gap-1 pb-4">
    {search.showYouTubePrompt && (
      <div className="flex flex-col items-center justify-center h-64 text-white/30">
        <SearchIcon className="w-12 h-12 mb-4 opacity-20" />
        <span className="text-base font-medium">
          {t("shortcuts.pressEsc")} <kbd className="px-2 py-1 bg-white/10 rounded text-white/60">Enter</kbd> {t("search.pressEnterToSearch")}
        </span>
      </div>
    )}
    {search.showYouTubeEmpty && (
      <div className="flex flex-col items-center justify-center h-64 text-white/20">
        <SearchIcon className="w-12 h-12 mb-4 opacity-20" />
        <span className="text-base font-medium">{t("search.noMatchesFound")}</span>
      </div>
    )}
    {search.showYouTubeLoading && (
      <div className="flex flex-col items-center justify-center h-64 text-white/20">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mb-4"></div>
        <span className="text-base font-medium">{t("search.searching")}</span>
      </div>
    )}
    {search.showYouTubeInitial && (
      <div className="flex flex-col items-center justify-center h-64 text-white/20">
        <SearchIcon className="w-12 h-12 mb-4 opacity-20" />
        <span className="text-base font-medium">{t("search.searchYouTubeMusic")}</span>
      </div>
    )}
    {search.youtubeResults.length > 0 && (
      <>
        {search.selectedIndex >= 0 && search.itemRefs.current[search.selectedIndex] && (
          <div className="absolute left-0 right-0 bg-white/25 backdrop-blur-md rounded-[10px] pointer-events-none transition-all duration-200 ease-out"
            style={{
              top: `${search.itemRefs.current[search.selectedIndex]?.offsetTop || 0}px`,
              height: `${search.itemRefs.current[search.selectedIndex]?.offsetHeight || 56}px`,
              zIndex: 0,
            }}
          />
        )}
        {search.youtubeResults.map((track: YouTubeMusicSearchResult, idx: number) => {
          const nowPlaying = search.isNowPlaying(track);
          return (
            <div key={`${track.id}-${idx}`} ref={(el) => { search.itemRefs.current[idx] = el; }}
              onClick={() => handleSelection(idx)}
              onContextMenu={(e) => search.openContextMenu(e, track, "youtube")}
              className={`relative z-10 group flex items-center gap-3 p-3 rounded-[10px] cursor-pointer ${search.selectedIndex === idx ? "text-white" : "hover:bg-white/5 hover:transition-colors hover:duration-150 text-white/90"}`}>
              <div className="relative w-10 h-10 rounded-[6px] bg-white/5 overflow-hidden shrink-0 shadow-sm group-hover:shadow-lg transition-shadow duration-200">
                {track.coverUrl && <SmartImage src={track.coverUrl} alt={track.title} containerClassName="w-full h-full" imgClassName={`w-full h-full object-cover transition-opacity ${nowPlaying ? "opacity-40 blur-[1px]" : ""}`} />}
                {!nowPlaying && <div className={`absolute inset-0 flex items-center justify-center bg-black/50 ${search.selectedIndex === idx ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-hover:transition-opacity group-hover:duration-150"}`}><PlayIcon className="w-4 h-4 fill-white drop-shadow-md" /></div>}
                {nowPlaying && isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center gap-[2px]">
                    <div className="w-[2px] bg-current rounded-full animate-[eq-bounce_1s_ease-in-out_infinite]" style={{ height: "8px", color: accentColor }}></div>
                    <div className="w-[2px] bg-current rounded-full animate-[eq-bounce_1s_ease-in-out_infinite_0.2s]" style={{ height: "14px", color: accentColor }}></div>
                    <div className="w-[2px] bg-current rounded-full animate-[eq-bounce_1s_ease-in-out_infinite_0.4s]" style={{ height: "10px", color: accentColor }}></div>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                <div className={`text-[15px] font-medium truncate ${search.selectedIndex === idx ? "text-white" : nowPlaying ? "" : "text-white/90"}`} style={nowPlaying ? { color: accentColor } : {}}>{track.title}</div>
                <div className={`text-[13px] truncate ${search.selectedIndex === idx ? "text-white/70" : "text-white/40"}`}>{track.artist}</div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={(e) => handleMenuClick(e, track.id)} className={`track-menu w-7 h-7 rounded-lg flex items-center justify-center transition-all ${menuTrackId === track.id ? "bg-white/20 text-white" : "text-white/40 hover:bg-white/10 hover:text-white/70"}`} title={t("search.moreOptions")}><MoreVerticalIcon className="w-4 h-4" /></button>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${search.selectedIndex === idx ? "border-white/30 text-white/80 bg-white/20" : "border-white/10 text-white/30 bg-white/5"}`}>YT</span>
              </div>
            </div>
          );
        })}
        {search.youtubeProvider.hasMore && (
          <div className="py-6 flex items-center justify-center">
            {search.youtubeProvider.isLoading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div> : <div className="text-white/20 text-xs">{t("search.scrollForMore")}</div>}
          </div>
        )}
      </>
    )}
  </div>
)}
```

### 4. 修复国际化

替换以下硬编码文本：

| 位置 | 原文 | 改为 |
|------|------|------|
| 第362行 | `"Search online..."` / `"Filter queue..."` | `t("search.searchOnline")` / `t("search.filterQueue")` |
| 第391行 | `"No songs in queue"` | `t("search.noSongsInQueue")` |
| 第500行 | `"Press Enter to search"` | `t("shortcuts.pressEsc") + " Enter " + t("search.pressEnterToSearch")` |
| 第511行 | `"No matches found"` | `t("search.noMatchesFound")` |
| 第520行 | `"Searching..."` | `t("search.searching")` |
| 第529行 | `"Search Cloud Music"` | `t("search.searchCloudMusic")` |
| 第651行 | `"Scroll for more"` | `t("search.scrollForMore")` |
| 第615行 | `"More options"` | `t("search.moreOptions")` |

## 功能特性

- 音乐类别过滤
- 智能标题解析
- 分页加载
- 中英文支持
- 键盘导航

## API 配额

- 默认：10,000 单位/天
- 搜索：100 单位/次
- 约等于：100 次搜索/天

## 故障排除

**API key not configured**: 检查 `.env` 文件并重启服务器  
**Search failed**: 验证 API 密钥和配额  
**无结果**: 尝试不同搜索词
