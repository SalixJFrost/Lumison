#!/bin/bash
# Lumison 构建脚本 (macOS/Linux)
# 用法: ./build.sh [windows|macos|linux|android|all]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

show_help() {
    echo -e "${CYAN}Lumison 构建脚本${NC}"
    echo ""
    echo -e "${YELLOW}用法: ./build.sh [platform]${NC}"
    echo ""
    echo -e "${GREEN}可用平台:${NC}"
    echo "  windows  - 构建 Windows 安装包 (NSIS + MSI) [需要在 Windows 上或使用交叉编译]"
    echo "  macos    - 构建 macOS 安装包 (DMG) [仅在 macOS 上可用]"
    echo "  linux    - 构建 Linux 安装包 (AppImage + deb) [仅在 Linux 上可用]"
    echo "  android  - 构建 Android 安装包 (APK + AAB)"
    echo "  all      - 构建当前平台的所有可用格式"
    echo "  help     - 显示此帮助信息"
    echo ""
    echo -e "${YELLOW}示例:${NC}"
    echo "  ./build.sh macos"
    echo "  ./build.sh android"
    echo ""
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        return 1
    fi
    return 0
}

build_windows() {
    echo -e "${CYAN}🔨 构建 Windows 安装包...${NC}"
    
    if ! check_command cargo; then
        echo -e "${RED}❌ 错误: 未找到 Rust。请先安装 Rust: https://rustup.rs/${NC}"
        exit 1
    fi
    
    if [[ "$OSTYPE" != "msys" && "$OSTYPE" != "win32" ]]; then
        echo -e "${RED}❌ 错误: Windows 构建需要在 Windows 系统上进行${NC}"
        echo -e "${YELLOW}💡 提示: 可以使用 GitHub Actions 进行跨平台构建${NC}"
        exit 1
    fi
    
    npm run tauri:build:windows
    
    echo -e "${GREEN}✅ Windows 构建完成!${NC}"
    echo -e "${YELLOW}📦 安装包位置:${NC}"
    echo "   - src-tauri/target/release/bundle/nsis/*.exe"
    echo "   - src-tauri/target/release/bundle/msi/*.msi"
}

build_macos() {
    echo -e "${CYAN}🔨 构建 macOS 安装包...${NC}"
    
    if [[ "$OSTYPE" != "darwin"* ]]; then
        echo -e "${RED}❌ 错误: macOS 构建只能在 macOS 系统上进行${NC}"
        echo -e "${YELLOW}💡 提示: 可以使用 GitHub Actions 进行跨平台构建${NC}"
        exit 1
    fi
    
    if ! check_command cargo; then
        echo -e "${RED}❌ 错误: 未找到 Rust。请先安装 Rust: https://rustup.rs/${NC}"
        exit 1
    fi
    
    # 检查 Xcode Command Line Tools
    if ! xcode-select -p &> /dev/null; then
        echo -e "${RED}❌ 错误: 未找到 Xcode Command Line Tools${NC}"
        echo -e "${YELLOW}运行: xcode-select --install${NC}"
        exit 1
    fi
    
    npm run tauri:build:macos
    
    echo -e "${GREEN}✅ macOS 构建完成!${NC}"
    echo -e "${YELLOW}📦 安装包位置:${NC}"
    echo "   - src-tauri/target/release/bundle/dmg/*.dmg"
    echo "   - src-tauri/target/release/bundle/macos/*.app"
}

build_linux() {
    echo -e "${CYAN}🔨 构建 Linux 安装包...${NC}"
    
    if [[ "$OSTYPE" != "linux-gnu"* ]]; then
        echo -e "${RED}❌ 错误: Linux 构建只能在 Linux 系统上进行${NC}"
        echo -e "${YELLOW}💡 提示: 可以使用 GitHub Actions 进行跨平台构建${NC}"
        exit 1
    fi
    
    if ! check_command cargo; then
        echo -e "${RED}❌ 错误: 未找到 Rust。请先安装 Rust: https://rustup.rs/${NC}"
        exit 1
    fi
    
    # 检查系统依赖
    echo -e "${YELLOW}📦 检查系统依赖...${NC}"
    if ! dpkg -l | grep -q libwebkit2gtk-4.1-dev; then
        echo -e "${YELLOW}⚠️  缺少系统依赖，尝试安装...${NC}"
        sudo apt-get update
        sudo apt-get install -y \
            libwebkit2gtk-4.1-dev \
            build-essential \
            curl \
            wget \
            file \
            libssl-dev \
            libgtk-3-dev \
            libayatana-appindicator3-dev \
            librsvg2-dev
    fi
    
    npm run tauri:build:linux
    
    echo -e "${GREEN}✅ Linux 构建完成!${NC}"
    echo -e "${YELLOW}📦 安装包位置:${NC}"
    echo "   - src-tauri/target/release/bundle/appimage/*.AppImage"
    echo "   - src-tauri/target/release/bundle/deb/*.deb"
}

build_android() {
    echo -e "${CYAN}🔨 构建 Android 安装包...${NC}"
    
    if ! check_command java; then
        echo -e "${RED}❌ 错误: 未找到 Java。请先安装 JDK 17+${NC}"
        exit 1
    fi
    
    # 检查 Android SDK
    if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
        echo -e "${RED}❌ 错误: 未设置 ANDROID_HOME 或 ANDROID_SDK_ROOT 环境变量${NC}"
        echo -e "${YELLOW}请安装 Android Studio 并设置环境变量${NC}"
        exit 1
    fi
    
    # 检查是否已初始化
    if [ ! -d "src-tauri/gen/android" ]; then
        echo -e "${YELLOW}📱 首次构建，正在初始化 Android 项目...${NC}"
        npm run tauri:android:init
    fi
    
    echo -e "${YELLOW}📱 构建 APK...${NC}"
    npm run tauri:build:android:apk
    
    echo -e "${GREEN}✅ Android APK 构建完成!${NC}"
    
    echo -e "${YELLOW}📱 构建 AAB...${NC}"
    npm run tauri:build:android:aab
    
    echo -e "${GREEN}✅ Android AAB 构建完成!${NC}"
    echo -e "${YELLOW}📦 安装包位置:${NC}"
    echo "   - src-tauri/gen/android/app/build/outputs/apk/**/*.apk"
    echo "   - src-tauri/gen/android/app/build/outputs/bundle/**/*.aab"
}

build_all() {
    echo -e "${CYAN}🔨 构建所有可用平台...${NC}"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        build_macos
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        build_linux
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        build_windows
    fi
    
    # Android 可以在所有平台构建
    echo ""
    read -p "是否也构建 Android 版本? (y/N): " response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        build_android
    fi
}

# 主逻辑
echo ""
echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     Lumison 构建工具 v1.0.0           ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
echo ""

# 检查 Node.js
if ! check_command node; then
    echo -e "${RED}❌ 错误: 未找到 Node.js。请先安装 Node.js 18+${NC}"
    exit 1
fi

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 安装依赖...${NC}"
    npm install
fi

# 执行构建
case "${1:-help}" in
    windows)
        build_windows
        ;;
    macos)
        build_macos
        ;;
    linux)
        build_linux
        ;;
    android)
        build_android
        ;;
    all)
        build_all
        ;;
    help|*)
        show_help
        ;;
esac

echo ""
echo -e "${GREEN}✨ 完成!${NC}"
echo ""
