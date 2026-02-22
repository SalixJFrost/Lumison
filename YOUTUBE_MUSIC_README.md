# YouTube Music 集成 - 快速指南

## 已完成 ✅

1. **核心服务**
   - `src/services/streaming/youtube/YouTubeMusicService.ts` - YouTube API 服务
   - `src/hooks/useYouTubeMusicSearchProvider.ts` - 搜索 Hook

2. **类型和状态**
   - `src/types.ts` - 添加 YouTube 字段
   - `src/hooks/useSearchModal.ts` - 添加 YouTube 支持

3. **国际化**
   - `src/i18n/locales/zh.ts` 和 `en.ts` - 添加 10 个新翻译键

## 待完成 ⚠️

1. **更新 SearchModal.tsx** - 详见 `docs/YOUTUBE_MUSIC.md`
   - 添加 YouTube 标签页
   - 添加 YouTube 结果显示
   - 修复 8 处硬编码文本

2. **配置 API 密钥**
   ```bash
   cp .env.example .env
   # 添加: VITE_YOUTUBE_API_KEY=your_key
   ```

3. **测试**
   - 中英文界面
   - 搜索功能
   - 播放功能

## 文档

📄 `docs/YOUTUBE_MUSIC.md` - 完整实现指南

## 新增翻译

```typescript
search: {
  youtube: "YouTube Music",
  filterQueue: "筛选队列..." / "Filter queue...",
  searchOnline: "在线搜索..." / "Search online...",
  noSongsInQueue: "队列中没有歌曲" / "No songs in queue",
  pressEnterToSearch: "按 Enter 键搜索" / "to search",
  noMatchesFound: "未找到匹配结果" / "No matches found",
  searchCloudMusic: "搜索网易云音乐" / "Search Cloud Music",
  searchYouTubeMusic: "搜索 YouTube Music" / "Search YouTube Music",
  scrollForMore: "向下滚动加载更多" / "Scroll for more",
  moreOptions: "更多选项" / "More options",
}
```

---

**下一步**: 按照 `docs/YOUTUBE_MUSIC.md` 更新 SearchModal.tsx
