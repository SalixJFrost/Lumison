# Lumison 歌词系统

## 概述

Lumison 采用多源歌词系统，参考 Poweramp 和 Salt Music 的实现，支持多种歌词来源并智能选择最佳歌词。

## 歌词来源优先级

### 1️⃣ 外部 LRC 文件（最高优先级）
- **格式**: `.lrc` 或 `.txt`
- **匹配方式**: 
  - 精确匹配：文件名与音频文件名完全相同
  - 模糊匹配：使用 Levenshtein 距离算法（相似度 ≥ 70%）
- **优势**: 用户明确提供，最准确

**示例**:
```
Artist - Song.mp3
Artist - Song.lrc  ✓ 精确匹配
```

### 2️⃣ 内嵌歌词（ID3/FLAC 标签）
支持以下标签格式：

#### MP3 (ID3v2)
- **USLT** (Unsynchronized Lyrics) - 纯文本歌词
- **SYLT** (Synchronized Lyrics) - 带时间戳的同步歌词
- **LYRICS** - 通用歌词标签

#### FLAC (Vorbis Comments)
- **LYRICS** - 歌词字段
- **UNSYNCEDLYRICS** - 非同步歌词

**技术实现**:
- 使用 `jsmediatags` 库解析 ID3 标签
- 自动检测并提取所有支持的歌词格式
- SYLT 格式保留精确时间戳

### 3️⃣ 在线歌词 API（备用）
- **来源**: 网易云音乐 API、Musixmatch 等
- **触发条件**: 本地无歌词时自动查询
- **匹配方式**: 标题 + 艺术家
- **缓存**: 自动缓存到本地

## 歌词解析

### LRC 格式
```lrc
[00:12.34]这是第一行歌词
[00:18.50]这是第二行歌词
[00:25.00]支持翻译
[00:25.00]Translation support
```

### 时间戳格式
- `[mm:ss.xx]` - 分:秒.厘秒（10ms）
- `[mm:ss.xxx]` - 分:秒.毫秒（1ms）

### 高级特性
- **字级同步**: 支持 SYLT 格式的字级时间戳
- **翻译支持**: 自动识别和显示翻译
- **间奏检测**: 自动插入间奏标记

## 同步显示

### 核心算法
```typescript
const currentTime = audio.currentTime;
const currentLine = lyrics.find(
  (line, i) => 
    line.time <= currentTime && 
    (lyrics[i + 1]?.time > currentTime || i === lyrics.length - 1)
);
```

### 视觉效果
- **滚动动画**: 当前行居中显示
- **高亮效果**: 当前行文字高亮
- **渐变过渡**: 平滑的行间过渡
- **模糊背景**: 非当前行模糊显示（可选）
- **发光效果**: 当前行发光（可选）

## 使用流程

### 1. 导入本地文件
```typescript
// 用户选择文件
const files = [
  'Artist - Song.mp3',
  'Artist - Song.lrc'  // 可选
];

// 系统自动处理
1. 提取 ID3 标签（标题、艺术家、封面）
2. 查找匹配的 LRC 文件
3. 提取内嵌歌词
4. 按优先级选择最佳歌词
```

### 2. 歌词优先级选择
```typescript
if (lrcFile.exists && lrcFile.lyrics.length > 0) {
  return lrcFile.lyrics;  // 使用外部 LRC
} else if (embedded.lyrics.length > 0) {
  return embedded.lyrics;  // 使用内嵌歌词
} else {
  fetchOnlineLyrics();  // 在线获取
}
```

### 3. 显示和同步
```typescript
// 实时同步
useEffect(() => {
  const interval = setInterval(() => {
    const currentTime = audio.currentTime;
    updateCurrentLine(currentTime);
  }, 100);  // 100ms 更新一次
}, [audio]);
```

## 性能优化

### 1. 解析优化
- 异步解析 ID3 标签，不阻塞 UI
- 缓存解析结果
- 延迟加载在线歌词

### 2. 渲染优化
- Canvas 渲染歌词（避免 DOM 操作）
- 虚拟滚动（只渲染可见行）
- requestAnimationFrame 控制帧率

### 3. 内存管理
- 及时清理 Blob URL
- 限制缓存大小
- 自动垃圾回收

## 用户体验

### 歌词来源指示
系统会在控制台显示歌词来源：
```
✓ Found matching LRC file: Song.lrc
✓ Found ID3 USLT lyrics
✓ Found FLAC LYRICS comment
📝 Using lrc-file lyrics for: Song
⚠️ No local lyrics found, will try online
```

### 手动导入歌词
用户可以随时导入 LRC 文件：
1. 点击歌词区域
2. 选择"导入歌词文件"
3. 选择 `.lrc` 文件
4. 立即应用

### 歌词编辑（未来功能）
- 在线编辑歌词
- 调整时间戳
- 添加翻译
- 导出为 LRC

## 技术栈

### 依赖库
- `jsmediatags` - ID3 标签解析
- `colorthief` - 封面颜色提取
- `@react-spring/web` - 动画效果

### 核心模块
- `src/services/lyrics/id3Parser.ts` - ID3 解析器
- `src/services/lyrics/parser.ts` - LRC 解析器
- `src/services/lyrics/lyricsService.ts` - 在线歌词服务
- `src/hooks/usePlaylist.ts` - 播放列表管理

## 最佳实践

### 文件命名
推荐使用统一的命名格式：
```
Artist - Song Title.mp3
Artist - Song Title.lrc
```

### LRC 文件编码
- 使用 UTF-8 编码
- 避免 BOM 标记
- 使用标准时间戳格式

### ID3 标签
- 使用 ID3v2.3 或 ID3v2.4
- 嵌入高质量封面（< 500KB）
- 填写完整的元数据

## 故障排除

### 歌词不显示
1. 检查文件名是否匹配
2. 检查 LRC 文件编码（应为 UTF-8）
3. 检查时间戳格式是否正确
4. 查看控制台日志

### 歌词不同步
1. 检查音频文件是否完整
2. 检查 LRC 时间戳是否准确
3. 尝试重新导入歌词

### 内嵌歌词无法读取
1. 确认文件格式（MP3/FLAC）
2. 检查 ID3 版本
3. 使用专业工具（如 Mp3tag）检查标签

## 参考资料

- [LRC 格式规范](https://en.wikipedia.org/wiki/LRC_(file_format))
- [ID3v2 标准](https://id3.org/id3v2.4.0-structure)
- [Vorbis Comment 规范](https://www.xiph.org/vorbis/doc/v-comment.html)
- [jsmediatags 文档](https://github.com/aadsm/jsmediatags)

## 未来计划

- [ ] 支持更多歌词格式（ASS、SRT）
- [ ] 卡拉 OK 模式（字级高亮）
- [ ] 歌词翻译 API 集成
- [ ] 歌词编辑器
- [ ] 歌词分享功能
- [ ] 歌词搜索和替换
- [ ] 批量歌词下载

---

**更新日期**: 2024
**版本**: 1.0
