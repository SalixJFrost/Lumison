# 音频源支持

## 支持的音频源

### ✅ 稳定音频源

#### 1. 本地文件 (Local Files)
- **稳定性**: ⭐⭐⭐⭐⭐ 完全稳定
- **支持格式**: MP3, WAV, OGG, M4A, FLAC, AAC
- **使用方式**: 拖拽文件或点击导入按钮
- **特点**:
  - 无需网络连接
  - 支持嵌入式歌词和封面
  - 支持 .lrc 歌词文件
  - 自动提取元数据

#### 2. Internet Archive (互联网档案馆)
- **稳定性**: ⭐⭐⭐⭐⭐ 非常稳定
- **URL 格式**: `https://archive.org/details/[identifier]`
- **特点**:
  - 公共领域和开放许可内容
  - 免费且合法
  - 支持高质量音频
  - 自动获取元数据和封面
- **示例**:
  ```
  https://archive.org/details/GratefulDead
  https://archive.org/details/78_rpm_collection
  ```

#### 3. 自托管音频 (Self-hosted Audio)
- **稳定性**: ⭐⭐⭐⭐⭐ 完全可控
- **URL 格式**: 直接音频文件链接
- **支持格式**: .mp3, .ogg, .wav, .m4a, .flac, .aac, .opus
- **特点**:
  - 完全控制音频源
  - 无第三方依赖
  - 支持 CORS 的服务器
- **示例**:
  ```
  https://example.com/music/song.mp3
  https://cdn.example.com/audio/track.ogg
  ```

### ⚠️ 不稳定音频源

#### 网易云音乐 (Netease Cloud Music)
- **稳定性**: ⭐⭐⭐ 不稳定
- **URL 格式**: 
  - 歌曲: `https://music.163.com/#/song?id=[id]`
  - 歌单: `https://music.163.com/#/playlist?id=[id]`
- **风险**:
  - 第三方 API 可能随时失效
  - 可能被封禁或限流
  - 版权限制
  - 地区限制
- **建议**: 仅用于测试，不建议生产环境使用

### ❌ 已移除的音频源

#### Bilibili (哔哩哔哩)
- **移除原因**:
  - API 不稳定，经常变更
  - 需要复杂的音频提取流程
  - 版权和法律风险
  - 维护成本高
- **替代方案**: 使用 Internet Archive 或自托管音频

#### YouTube Music
- **不支持原因**:
  - 违反服务条款
  - 技术实现复杂
  - 法律风险高

#### SoundCloud
- **不支持原因**:
  - API 访问受限
  - 需要认证
  - 不稳定

## 使用指南

### 导入本地文件

1. 点击导入按钮或直接拖拽文件到播放器
2. 支持批量导入
3. 自动读取元数据和歌词
4. 支持 .lrc 歌词文件（与音频文件同名）

### 导入 Internet Archive 音频

1. 访问 [Internet Archive](https://archive.org/)
2. 搜索音乐内容
3. 复制详情页 URL（格式：`https://archive.org/details/[identifier]`）
4. 在 Lumison 中点击导入，粘贴 URL

### 导入自托管音频

1. 确保音频文件可通过 HTTP/HTTPS 访问
2. 服务器需要支持 CORS
3. 复制音频文件的直接链接
4. 在 Lumison 中点击导入，粘贴 URL

**服务器 CORS 配置示例（Nginx）：**
```nginx
location /music/ {
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods 'GET, HEAD, OPTIONS';
    add_header Access-Control-Allow-Headers 'Range';
}
```

### 导入网易云音乐

1. 访问 [网易云音乐](https://music.163.com/)
2. 找到想要的歌曲或歌单
3. 复制页面 URL
4. 在 Lumison 中点击导入，粘贴 URL
5. ⚠️ 注意：此功能可能不稳定

## 技术实现

### Internet Archive 集成

```typescript
// 解析 Internet Archive URL
const identifier = parseInternetArchiveUrl(url);

// 获取元数据
const metadata = await fetch(`https://archive.org/metadata/${identifier}`);

// 构建音频 URL
const audioUrl = `https://archive.org/download/${identifier}/${filename}`;
```

### 自托管音频验证

```typescript
// 验证 URL 是否为音频文件
const isAudioFile = ['.mp3', '.ogg', '.wav', '.m4a', '.flac', '.aac', '.opus']
  .some(ext => url.toLowerCase().endsWith(ext));

// 验证 Content-Type
const response = await fetch(url, { method: 'HEAD' });
const contentType = response.headers.get('content-type');
const isAudio = contentType?.startsWith('audio/');
```

## 最佳实践

### 推荐使用顺序

1. **本地文件** - 最稳定，最快速
2. **自托管音频** - 完全可控，适合个人音乐库
3. **Internet Archive** - 合法免费，适合公共领域音乐
4. **网易云音乐** - 仅用于测试，不建议依赖

### 性能优化

- 本地文件使用 Blob URL，无需网络请求
- Internet Archive 支持 Range 请求，可实现流式播放
- 自托管音频建议使用 CDN 加速
- 启用浏览器缓存以减少重复加载

### 安全建议

- 仅从可信来源导入音频
- 自托管音频使用 HTTPS
- 注意版权和许可证
- 不要分享受版权保护的内容

## 故障排除

### Internet Archive 无法加载

- 检查网络连接
- 确认 identifier 正确
- 验证内容包含音频文件
- 尝试直接访问 archive.org

### 自托管音频无法播放

- 检查 CORS 配置
- 确认文件格式支持
- 验证 URL 可访问
- 检查浏览器控制台错误

### 网易云音乐导入失败

- API 可能暂时不可用
- 歌曲可能有地区限制
- 尝试使用其他音频源
- 考虑下载后作为本地文件导入

## 未来计划

### 可能添加的音频源

- WebDAV 服务器支持
- Subsonic/Airsonic 集成
- Jellyfin/Emby 集成
- IPFS 支持

### 改进方向

- 更好的元数据提取
- 自动歌词匹配
- 音频格式转换
- 离线缓存支持

## 相关文件

- `src/services/music/audioStreamService.ts` - 音频流服务
- `src/services/music/lyricsService.ts` - 网易云音乐服务
- `src/hooks/usePlaylist.ts` - 播放列表管理
- `src/types.ts` - 类型定义
