# Lumison 歌词系统

## 概述

Lumison 采用多源歌词系统，参考 Poweramp 和 Salt Music 的实现，支持多种歌词来源并智能选择最佳歌词。

## 歌词来源优先级

系统会按照以下优先级自动选择最佳歌词来源：

### 1️⃣ 内嵌歌词（ID3/FLAC 标签）- 最高优先级
- **优先级**: 最高
- **优势**: 歌词随音频文件一起，最可靠，无需额外文件或网络
- **推荐**: 对于本地音乐库，这是最方便和最可靠的方式
- **使用场景**: 当你的音频文件已经包含歌词标签时

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
- 导入音频文件时自动提取，无需手动操作

### 2️⃣ 在线歌词 API - 次优先级（备用）

#### 搜索策略：并行搜索，最快响应优先

系统会同时向多个平台发起请求，使用最快返回的结果。如果网易云音乐有结果，会优先使用（因为支持逐字歌词和翻译）。

#### 平台列表：

**主要平台（并行搜索）：**

1. **网易云音乐（Netease Music）** - 默认启用 ✅
   - 最稳定可靠
   - 支持逐字歌词（YRC）
   - 支持翻译歌词
   - 多个镜像 API 自动选择最快的
   - 中文歌曲覆盖最全

2. **第三方歌词 API（并行搜索多个源）** - 默认启用 ✅
   - **LrcLib** (https://lrclib.net) - 最大的开源歌词库
   - **LRCAPI** (https://lrc.xms.mx) - 支持多语言
   - **Lyrics.ovh** - 简单但覆盖广泛
   - **Syair.info** - 亚洲音乐覆盖好
   - 适合国际歌曲和网易云没有版权的歌曲（如周杰伦）

**备用平台（仅在主要平台失败时使用）：**

3. **QQ 音乐** - 默认禁用 ❌
   - 由于 CORS 问题频繁失败
   - 可手动启用（见下方配置）

4. **酷狗音乐** - 默认禁用 ❌
   - 由于 CORS 问题频繁失败
   - 可手动启用（见下方配置）

#### 平台配置

在浏览器控制台中，你可以查看和修改平台配置：

```javascript
// 查看当前配置
import { getPlatformConfig } from './services/music';
getPlatformConfig();

// 启用 QQ 音乐和酷狗音乐（如果你有可用的代理）
import { updatePlatformConfig } from './services/music';
updatePlatformConfig({ qq: true, kugou: true });

// 禁用第三方 API
updatePlatformConfig({ thirdParty: false });
```

**优势**：
- **并行搜索**：网易云和第三方 API 同时搜索，速度更快
- **覆盖更广**：网易云没有的歌曲（如周杰伦）可以从第三方 API 获取
- **智能选择**：优先使用网易云的逐字歌词，但不会因为网易云没有而放弃搜索

**注意**：
- **触发条件**: 仅当没有内嵌歌词时才会自动查询
- **匹配方式**: 标题 + 艺术家
- **缓存**: 自动缓存到本地
- **CORS 问题**: QQ 音乐和酷狗音乐因浏览器跨域限制经常失败，因此默认禁用

### 3️⃣ 外部 LRC 文件 - 最低优先级（最后备用）
- **格式**: `.lrc` 或 `.txt`
- **匹配方式**: 
  - 精确匹配：文件名与音频文件名完全相同
  - 模糊匹配：使用 Levenshtein 距离算法（相似度 ≥ 70%）
- **使用场景**: 当内嵌歌词和在线API都失败时的最后备用

**示例**:
```
Artist - Song.mp3
Artist - Song.lrc  ✓ 作为最后备用
```

### 优先级总结

```
内嵌ID3/FLAC歌词 > 在线API > 外部LRC文件
    (最高)         (次优)     (最低)
```

**重要提示**: 
- ✅ 如果音频文件包含内嵌歌词，系统会优先使用，不会进行在线搜索
- ✅ 只有当没有内嵌歌词时，才会尝试在线获取
- ✅ 在线搜索失败时，会回退到LRC文件（如果有）
- ✅ 推荐使用内嵌歌词，最可靠且无需网络

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

系统会按照以下流程自动选择最佳歌词：

```typescript
// 步骤1: 导入音频文件时
1. 提取ID3/FLAC内嵌歌词（最高优先级）
2. 查找同名LRC文件（作为最后备用）

// 步骤2: 优先级判断
if (embedded.lyrics.length > 0) {
  // 优先使用内嵌歌词
  useLyrics = embedded.lyrics;
  needsOnlineSearch = false;  // 有内嵌歌词就不搜索在线
} else {
  // 无内嵌歌词，标记需要在线搜索
  useLyrics = [];
  needsOnlineSearch = true;
  // LRC文件作为最后备用保存
  fallbackLyrics = lrcFile.lyrics;
}

// 步骤3: 播放时（仅当needsOnlineSearch=true）
if (needsOnlineSearch && useLyrics.length === 0) {
  const onlineLyrics = await fetchOnlineLyrics();
  
  if (onlineLyrics) {
    useLyrics = onlineLyrics;  // 使用在线歌词
  } else if (fallbackLyrics.length > 0) {
    useLyrics = fallbackLyrics;  // 在线失败，使用LRC文件
  }
}
```

**关键点**:
- ✅ 内嵌歌词会阻止在线搜索
- ✅ 只有无内嵌歌词时才会联网
- ✅ 在线搜索失败会回退到LRC文件
- ✅ LRC文件仅作为最后备用

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
1. **检查文件名是否匹配** - LRC文件名应与音频文件名相同
2. **检查 LRC 文件编码** - 应为 UTF-8（不带BOM）
3. **检查时间戳格式** - 应为 `[mm:ss.xx]` 格式
4. **查看控制台日志** - 打开开发者工具查看详细信息

### 内嵌歌词未被识别
1. **确认文件格式** - 仅支持 MP3 (ID3v2) 和 FLAC (Vorbis Comments)
2. **检查 ID3 版本** - 推荐使用 ID3v2.3 或 ID3v2.4
3. **使用专业工具检查** - 推荐使用 [Mp3tag](https://www.mp3tag.de/) 或 [MusicBrainz Picard](https://picard.musicbrainz.org/)
4. **查看支持的标签**:
   - MP3: USLT, SYLT, LYRICS
   - FLAC: LYRICS, UNSYNCEDLYRICS

### 系统使用了在线歌词而不是内嵌歌词
这种情况**不应该发生**。如果出现，请：

1. **查看控制台日志** - 应该显示歌词来源
   ```
   ✓ Found ID3 USLT lyrics
   📝 Using embedded ID3/FLAC lyrics (highest priority) for: Song Title
   ```

2. **确认内嵌歌词格式** - 使用 Mp3tag 检查歌词标签是否存在且非空

3. **重新导入文件** - 删除歌曲后重新导入

4. **报告问题** - 如果问题持续，请在 GitHub 提交 issue

### 系统使用了LRC文件而不是内嵌歌词
这种情况**不应该发生**（内嵌歌词优先级最高）。如果出现，请：

1. **查看控制台日志** - 确认内嵌歌词是否被提取
2. **检查内嵌歌词** - 使用 Mp3tag 确认歌词标签存在
3. **重新导入文件** - 删除后重新导入
4. **报告问题** - 如果问题持续，请提交 issue

### 歌词不同步
1. **检查音频文件是否完整** - 损坏的文件可能导致时间不准
2. **检查 LRC 时间戳是否准确** - 使用歌词编辑器调整
3. **尝试重新导入歌词** - 删除后重新添加

### 在线搜索失败
1. **检查网络连接** - 确保可以访问互联网
2. **检查歌曲信息** - 标题和艺术家应该准确
3. **使用本地歌词** - 推荐使用内嵌歌词或LRC文件，更可靠

### 优先级验证

想确认系统是否正确使用了内嵌歌词？查看控制台日志：

```javascript
// 正确的优先级流程：

// 1. 导入时
✓ Found ID3 USLT lyrics
📝 Using embedded ID3/FLAC lyrics (highest priority) for: Song Title

// 2. 播放时
🎵 Lyrics matching check for: "Song Title" by "Artist"
   - needsLyricsMatch: false  // ← 应该是 false
   - existing lyrics: 45 lines  // ← 应该有歌词
   ✅ Using existing embedded lyrics (highest priority)

// 如果看到这个，说明优先级正确！
```

如果日志显示 `needsLyricsMatch: true` 但你确定有内嵌歌词，说明提取失败，请检查文件格式和标签。

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
