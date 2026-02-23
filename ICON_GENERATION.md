# Lumison 图标生成指南

## ✅ 已完成

应用图标已成功生成并应用到所有平台！

## 📦 生成的文件

### 桌面平台
- `src-tauri/icons/icon.ico` - Windows 图标
- `src-tauri/icons/icon.icns` - macOS 图标
- `src-tauri/icons/icon.png` - 源图标 (1024x1024)
- `src-tauri/icons/32x32.png` - 小图标
- `src-tauri/icons/64x64.png` - 中图标
- `src-tauri/icons/128x128.png` - 大图标
- `src-tauri/icons/128x128@2x.png` - 高清图标

### Windows Store
- `src-tauri/icons/StoreLogo.png`
- `src-tauri/icons/Square*.png` - 各种尺寸的方形图标

### 移动平台
- `src-tauri/icons/android/` - Android 图标
- `src-tauri/icons/ios/` - iOS 图标

## 🎨 图标设计

**主题**：耳机 + 发光光带

**设计元素**：
- 极简耳机轮廓
- 发光的光带穿过中间
- 光带末端形成 "L" 字母
- 银白金属质感
- 暖白色光带
- 深灰色背景 (#1A1A1A)

**风格**：
- 简洁、现代
- 易于识别
- 适合音乐播放器定位

## 🔧 如何重新生成图标

### 方法 1：一键生成（推荐）

```bash
npm run generate:all-icons
```

这个命令会：
1. 将 SVG 转换为 PNG (1024x1024)
2. 自动生成所有平台的图标

### 方法 2：分步生成

```bash
# 步骤 1: 生成 PNG
npm run generate:icon

# 步骤 2: 生成所有平台图标
npm run tauri:icon src-tauri/icons/icon.png
```

## 📝 修改图标

如果需要修改图标设计：

1. 编辑 `src-tauri/icons/icon.svg`
2. 运行 `npm run generate:all-icons`
3. 重新构建应用

## 🚀 构建应用

生成图标后，可以构建桌面应用：

```bash
# Windows
npm run tauri:build:windows

# macOS
npm run tauri:build:macos

# Linux
npm run tauri:build:linux
```

构建的应用将使用新的图标。

## 📱 Web 应用图标

Web 应用使用的图标位于：
- `public/icon.svg` - 动态版本（带动画）
- `public/icon-static.svg` - 静态版本（favicon）

这些图标会自动应用到：
- 浏览器标签页
- PWA 应用图标
- 书签图标

## 🎯 技术细节

- **源格式**：SVG (矢量图形)
- **输出格式**：PNG, ICO, ICNS
- **推荐尺寸**：1024x1024
- **工具**：
  - `sharp` - SVG 到 PNG 转换
  - `@tauri-apps/cli` - 多平台图标生成

## ✨ 效果预览

图标在不同平台的显示效果：

- **Windows 任务栏**：32x32
- **Windows 桌面**：64x64 或 128x128
- **macOS Dock**：128x128@2x
- **应用启动器**：各种尺寸自适应

所有图标都已优化，在不同尺寸下都清晰可辨！
