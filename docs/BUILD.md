# Lumison 构建指南

本文档介绍如何为不同平台构建 Lumison 安装包。

## 前置要求

### 所有平台通用
- Node.js 18+ 
- Rust 1.70+
- npm 或 yarn

### Windows
- Visual Studio 2022 (包含 C++ 构建工具)
- WebView2 (Windows 10/11 已内置)

### macOS
- Xcode Command Line Tools
- 如需签名和公证，需要 Apple Developer 账号

### Linux
- 基本构建工具：`build-essential`, `libwebkit2gtk-4.1-dev`, `libssl-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`

### Android
- Android Studio
- Android SDK (API 24+)
- Android NDK
- Java JDK 17+

## 安装依赖

```bash
# 安装 Node.js 依赖
npm install

# 安装 Rust (如果还没有)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 安装 Tauri CLI (如果还没有)
cargo install tauri-cli
```

## 构建命令

### Windows 构建

```bash
# 构建 Windows 安装包 (NSIS + MSI)
npm run tauri:build:windows

# 或使用默认构建命令（会构建当前平台）
npm run tauri:build
```

构建产物位置：
- `src-tauri/target/release/bundle/nsis/Lumison_1.0.0_x64-setup.exe`
- `src-tauri/target/release/bundle/msi/Lumison_1.0.0_x64_en-US.msi`

### macOS 构建

```bash
# 构建通用二进制（Intel + Apple Silicon）
npm run tauri:build:macos

# 或分别构建
npm run tauri:build:macos:intel    # Intel 芯片
npm run tauri:build:macos:silicon  # Apple Silicon (M1/M2/M3)
```

构建产物位置：
- `src-tauri/target/release/bundle/dmg/Lumison_1.0.0_universal.dmg`
- `src-tauri/target/release/bundle/macos/Lumison.app`

**注意**：
- 在 Windows 上无法构建 macOS 版本
- 需要在 macOS 系统上构建
- 如需分发，建议进行代码签名和公证

### Linux 构建

```bash
# 构建 Linux 安装包 (AppImage + deb)
npm run tauri:build:linux
```

构建产物位置：
- `src-tauri/target/release/bundle/appimage/lumison_1.0.0_amd64.AppImage`
- `src-tauri/target/release/bundle/deb/lumison_1.0.0_amd64.deb`

### Android 构建

#### 首次构建前需要初始化

```bash
# 初始化 Android 项目
npm run tauri:android:init
```

这会创建 `src-tauri/gen/android` 目录。

**重要提示**: Android 构建需要以下文件：
- `src-tauri/src/lib.rs` - Library 入口点
- `src-tauri/src/mobile.rs` - 移动平台特定代码
- `Cargo.toml` 中的 `[lib]` 配置

这些文件已经配置好，无需手动创建。

#### 构建 APK（用于测试和直接安装）

```bash
# 构建 APK
npm run tauri:build:android:apk

# 或使用开发模式（连接设备/模拟器）
npm run tauri:android:dev
```

构建产物位置：
- `src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk`

#### 构建 AAB（用于 Google Play 发布）

```bash
# 构建 Android App Bundle
npm run tauri:build:android:aab
```

构建产物位置：
- `src-tauri/gen/android/app/build/outputs/bundle/universalRelease/app-universal-release.aab`

**Android 构建注意事项**：
1. 首次构建需要下载大量依赖，可能需要较长时间
2. 需要配置签名密钥才能发布到 Google Play
3. APK 需要签名后才能安装到设备
4. 某些功能可能需要在 `AndroidManifest.xml` 中添加权限
5. 自动更新插件在移动平台不可用（仅桌面平台支持）

## 签名和发布

### Windows 签名

```bash
# 使用 signtool 签名
signtool sign /f certificate.pfx /p password /t http://timestamp.digicert.com Lumison_setup.exe
```

### macOS 签名和公证

```bash
# 签名
codesign --deep --force --verify --verbose --sign "Developer ID Application: Your Name" Lumison.app

# 公证（需要 Apple Developer 账号）
xcrun notarytool submit Lumison.dmg --apple-id your@email.com --password app-specific-password --team-id TEAMID
```

### Android 签名

```bash
# 生成签名密钥
keytool -genkey -v -keystore lumison-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias lumison

# 签名 APK
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore lumison-release-key.jks app-release-unsigned.apk lumison

# 对齐 APK
zipalign -v 4 app-release-unsigned.apk Lumison-release.apk
```

## 跨平台构建

由于平台限制，建议使用 CI/CD 进行跨平台构建：

- **Windows**: 在 Windows 上构建
- **macOS**: 在 macOS 上构建（可以构建 Intel 和 Apple Silicon 版本）
- **Linux**: 在 Linux 上构建
- **Android**: 可以在任何平台上构建（推荐 Linux/macOS）

### GitHub Actions 示例

可以使用 GitHub Actions 自动构建所有平台：

```yaml
name: Build
on: [push, pull_request]

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install
      - run: npm run tauri:build:windows

  build-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install
      - run: npm run tauri:build:macos

  build-linux:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install
      - run: sudo apt-get update && sudo apt-get install -y libwebkit2gtk-4.1-dev
      - run: npm run tauri:build:linux

  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '17'
      - run: npm install
      - run: npm run tauri:android:init
      - run: npm run tauri:build:android:apk
```

## 构建优化

### 减小包体积

在 `Cargo.toml` 中添加：

```toml
[profile.release]
opt-level = "z"     # 优化体积
lto = true          # 链接时优化
codegen-units = 1   # 更好的优化
strip = true        # 移除调试符号
```

### 加速构建

```bash
# 使用 sccache 缓存编译结果
cargo install sccache
export RUSTC_WRAPPER=sccache

# 使用更多 CPU 核心
export CARGO_BUILD_JOBS=8
```

## 故障排除

### Windows 构建失败
- 确保安装了 Visual Studio C++ 构建工具
- 检查 WebView2 是否已安装

### macOS 构建失败
- 运行 `xcode-select --install` 安装命令行工具
- 检查 Xcode 许可协议：`sudo xcodebuild -license accept`

### Android 构建失败
- 确保 `ANDROID_HOME` 和 `JAVA_HOME` 环境变量已设置
- 检查 Android SDK 和 NDK 是否已安装
- 运行 `./gradlew clean` 清理构建缓存

### 依赖问题
```bash
# 清理并重新安装
rm -rf node_modules package-lock.json
npm install

# 清理 Rust 缓存
cargo clean
```

## 更多信息

- [Tauri 官方文档](https://tauri.app/v2/guides/)
- [Tauri Android 指南](https://tauri.app/v2/guides/building/android/)
- [Tauri 构建配置](https://tauri.app/v2/reference/config/)
