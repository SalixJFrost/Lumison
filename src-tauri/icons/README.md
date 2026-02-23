# Lumison 应用图标

本目录包含 Tauri 桌面应用的图标文件。

## 当前图标

使用耳机 + 光带设计，呼应 Lumison 的音乐播放器定位。

## 生成图标步骤

### 方法 1：使用在线工具（推荐）

1. 打开 `icon.svg` 文件
2. 访问在线 SVG 转 PNG 工具：
   - https://svgtopng.com/
   - https://cloudconvert.com/svg-to-png
   - https://convertio.co/svg-png/
3. 上传 `icon.svg`，设置尺寸为 **1024x1024**
4. 下载生成的 PNG 文件，重命名为 `icon.png`
5. 将 `icon.png` 放到此目录（`src-tauri/icons/`）
6. 运行命令生成所有平台图标：
   ```bash
   npm run tauri:icon
   ```

### 方法 2：使用 Inkscape（本地工具）

1. 安装 Inkscape：https://inkscape.org/
2. 打开 `icon.svg`
3. 文件 → 导出 PNG 图像
4. 设置宽度和高度为 1024
5. 导出为 `icon.png`
6. 运行 `npm run tauri:icon`

### 方法 3：使用 ImageMagick（命令行）

```bash
# 安装 ImageMagick
# Windows: choco install imagemagick
# macOS: brew install imagemagick
# Linux: sudo apt install imagemagick

# 转换 SVG 到 PNG
magick convert -background none -size 1024x1024 icon.svg icon.png

# 生成所有平台图标
npm run tauri:icon
```

## 图标文件说明

运行 `npm run tauri:icon` 后会自动生成：

- `icon.ico` - Windows 图标
- `icon.icns` - macOS 图标
- `icon.png` - 源图标（1024x1024）
- `32x32.png`, `64x64.png`, `128x128.png`, `128x128@2x.png` - 各种尺寸
- `Square*.png` - Windows Store 图标
- `android/` - Android 平台图标
- `ios/` - iOS 平台图标

## 设计说明

- **主题**：耳机 + 发光光带
- **配色**：银白金属质感 + 暖白光带
- **背景**：深灰色 (#1A1A1A)
- **风格**：简洁、现代、易识别
- **尺寸**：1024x1024（推荐）

## 注意事项

1. 源图标应为 **1024x1024** 或更大尺寸
2. 使用 PNG 格式，支持透明背景
3. 避免过于复杂的细节（小尺寸下可能看不清）
4. 确保图标在深色和浅色背景下都清晰可见
