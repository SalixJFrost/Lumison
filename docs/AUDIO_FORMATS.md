# 支持的音频格式

## 浏览器原生支持的格式

Lumison 使用 HTML5 Audio API，支持的格式取决于浏览器。以下是主流浏览器的支持情况：

### 完全支持（所有现代浏览器）

| 格式 | 扩展名 | MIME类型 | 说明 |
|------|--------|----------|------|
| MP3 | .mp3 | audio/mpeg | 最广泛支持的格式 |
| WAV | .wav | audio/wav, audio/wave | 无损格式，文件较大 |
| OGG Vorbis | .ogg | audio/ogg | 开源格式 |
| WebM | .webm | audio/webm | 现代Web格式 |
| AAC | .m4a, .aac | audio/mp4, audio/aac | 高质量压缩 |

### 部分支持（取决于浏览器）

| 格式 | 扩展名 | Chrome | Firefox | Safari | Edge |
|------|--------|--------|---------|--------|------|
| FLAC | .flac | ✅ | ✅ | ✅ | ✅ |
| Opus | .opus | ✅ | ✅ | ⚠️ | ✅ |
| AIFF | .aiff, .aif | ⚠️ | ❌ | ✅ | ⚠️ |
| ALAC | .m4a | ❌ | ❌ | ✅ | ❌ |
| WMA | .wma | ❌ | ❌ | ❌ | ⚠️ |
| APE | .ape | ❌ | ❌ | ❌ | ❌ |

✅ = 完全支持
⚠️ = 部分支持或需要特定条件
❌ = 不支持

## 当前配置

文件输入接受以下格式：
```
audio/*,.mp3,.wav,.flac,.m4a,.aac,.ogg,.opus,.wma,.ape,.alac,.aiff,.webm,.lrc,.txt
```

## WAV 文件播放问题

如果 WAV 文件无法播放，可能的原因：

### 1. 编码问题
WAV 文件有多种编码方式：
- **PCM** (最常见，完全支持)
- **ADPCM** (部分支持)
- **IEEE Float** (部分支持)
- **其他编码** (可能不支持)

### 2. 采样率问题
- 标准采样率：44.1kHz, 48kHz (完全支持)
- 高采样率：96kHz, 192kHz (可能有问题)
- 低采样率：8kHz, 16kHz (通常支持)

### 3. 位深度问题
- 16-bit (完全支持)
- 24-bit (部分支持)
- 32-bit (可能有问题)

### 4. 声道问题
- 单声道 (Mono) - 支持
- 立体声 (Stereo) - 支持
- 多声道 (5.1, 7.1) - 可能不支持

## 解决方案

### 方案1：转换格式（推荐）
使用音频转换工具将 WAV 转换为更兼容的格式：

**推荐工具：**
- [FFmpeg](https://ffmpeg.org/) (命令行)
- [Audacity](https://www.audacityteam.org/) (图形界面)
- [fre:ac](https://www.freac.org/) (图形界面)

**转换命令（FFmpeg）：**
```bash
# 转换为 MP3
ffmpeg -i input.wav -codec:a libmp3lame -qscale:a 2 output.mp3

# 转换为 FLAC（无损）
ffmpeg -i input.wav -codec:a flac output.flac

# 转换为标准 WAV (PCM 16-bit 44.1kHz)
ffmpeg -i input.wav -acodec pcm_s16le -ar 44100 output.wav
```

### 方案2：检查文件信息
使用工具检查 WAV 文件的详细信息：

**使用 FFmpeg：**
```bash
ffmpeg -i your_file.wav
```

**使用 MediaInfo：**
```bash
mediainfo your_file.wav
```

### 方案3：在线转换
- [CloudConvert](https://cloudconvert.com/wav-to-mp3)
- [Online Audio Converter](https://online-audio-converter.com/)
- [Convertio](https://convertio.co/wav-mp3/)

## 测试步骤

1. **检查浏览器控制台**
   - 打开开发者工具 (F12)
   - 查看 Console 标签
   - 查找错误信息

2. **检查网络请求**
   - 切换到 Network 标签
   - 查看音频文件的加载状态
   - 检查 HTTP 状态码

3. **测试不同格式**
   - 尝试转换为 MP3 格式
   - 测试是否能正常播放

## 元数据支持

不同格式的元数据标签支持：

| 格式 | 标签格式 | 支持情况 |
|------|----------|----------|
| MP3 | ID3v2 | ✅ 完全支持 |
| FLAC | Vorbis Comments | ✅ 完全支持 |
| M4A/AAC | iTunes | ✅ 完全支持 |
| OGG | Vorbis Comments | ✅ 完全支持 |
| WAV | RIFF INFO | ⚠️ 部分支持 |
| AIFF | ID3v2 | ⚠️ 部分支持 |

## 推荐格式

根据使用场景选择合适的格式：

### 🎵 日常听歌
- **MP3** (320kbps) - 兼容性最好，文件大小适中
- **AAC** (256kbps) - 音质更好，文件更小

### 🎼 高音质需求
- **FLAC** - 无损压缩，音质最佳
- **ALAC** - Apple 无损格式（仅 Safari）

### 🌐 Web 应用
- **MP3** - 最佳兼容性
- **WebM** - 现代浏览器，文件小

### 💾 存储空间有限
- **Opus** - 低码率下音质最好
- **AAC** - 压缩效率高

## 常见问题

### Q: 为什么我的 WAV 文件无法播放？
A: 可能是编码格式不兼容。尝试转换为标准 PCM 16-bit 44.1kHz WAV 或 MP3。

### Q: FLAC 文件可以播放吗？
A: 是的，现代浏览器都支持 FLAC。

### Q: 支持无损格式吗？
A: 支持 FLAC（所有浏览器）和 ALAC（仅 Safari）。

### Q: 可以播放高采样率音频吗？
A: 可以，但建议使用 48kHz 或以下以获得最佳兼容性。

### Q: 为什么某些格式在不同浏览器表现不同？
A: 音频格式支持由浏览器决定，不同浏览器的支持程度不同。

## 技术细节

### HTML5 Audio API
Lumison 使用标准的 HTML5 `<audio>` 元素：

```html
<audio src="song.mp3" controls></audio>
```

### 支持的 MIME 类型
```javascript
const supportedMimeTypes = [
  'audio/mpeg',      // MP3
  'audio/wav',       // WAV
  'audio/wave',      // WAV (alternative)
  'audio/flac',      // FLAC
  'audio/mp4',       // M4A/AAC
  'audio/aac',       // AAC
  'audio/ogg',       // OGG Vorbis
  'audio/opus',      // Opus
  'audio/webm',      // WebM
  'audio/x-m4a',     // M4A (alternative)
];
```

### 检测浏览器支持
```javascript
const audio = document.createElement('audio');
const canPlayMP3 = audio.canPlayType('audio/mpeg');
const canPlayWAV = audio.canPlayType('audio/wav');
const canPlayFLAC = audio.canPlayType('audio/flac');

console.log('MP3:', canPlayMP3);   // "probably" or "maybe" or ""
console.log('WAV:', canPlayWAV);   // "probably" or "maybe" or ""
console.log('FLAC:', canPlayFLAC); // "probably" or "maybe" or ""
```

## 参考资料

- [MDN: Audio formats](https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Audio_codecs)
- [Can I Use: Audio formats](https://caniuse.com/?search=audio)
- [HTML5 Audio](https://www.w3schools.com/html/html5_audio.asp)
