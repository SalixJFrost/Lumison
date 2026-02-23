# Lumison - 视觉艺术音乐播放器

[English](README.md) | 简体中文

<div align="center">

![Lumison Logo](public/icon.svg)

**一款高保真、沉浸式的音乐播放器，灵感来自 Apple Music**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tauri](https://img.shields.io/badge/Tauri-2.0-blue.svg)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-19.2-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)

[在线体验](https://salixjfrost.github.io/Lumison/) | [下载桌面版](https://github.com/SalixJFrost/Lumison/releases) | [查看文档](docs/GUIDE.md)

</div>

## ✨ 特性

### 🎵 核心功能
- **高保真音乐播放** - 支持多种格式（MP3、FLAC、WAV 等）
- **流畅的背景动画** - 响应音乐和专辑封面的动态背景
- **同步歌词显示** - 平滑滚动和基于物理的动画效果
- **播放列表管理** - 支持拖放操作
- **搜索集成** - 集成网易云音乐 API

### 🎨 视觉体验
- **无边框窗口设计** - 现代美学
- **响应式布局** - 适配桌面和移动端
- **深色/浅色主题** - 自动切换
- **多语言支持** - 中文、英文、日文
- **流畅动画** - 60fps 性能优化

### 🎧 音频功能
- **变速播放** (0.25x - 2.0x) 支持音调保持
- **音量控制** 带可视化反馈
- **音频可视化** (可选，可关闭以节省内存)
- **空间音频引擎** 提供沉浸式体验
- **智能格式检测** 和错误处理

### 💻 桌面集成
- 原生窗口控制（最小化、最大化、关闭）
- 系统托盘集成
- 媒体会话 API 支持
- **自动更新功能** (启动时静默检查)

## 📦 安装

### Windows 桌面版

从 [Releases](https://github.com/SalixJFrost/Lumison/releases) 下载最新版本：

- **MSI 安装包** (推荐企业用户): `Lumison_x.x.x_x64_en-US.msi`
- **NSIS 安装包** (更小、更快): `Lumison_x.x.x_x64-setup.exe`

双击安装即可。应用将安装到 `C:\Program Files\Lumison\`。

### 网页版

直接访问：https://salixjfrost.github.io/Lumison/

无需安装，在浏览器中即可使用。

## 🚀 快速开始

### 开发环境

```bash
# 克隆仓库
git clone https://github.com/SalixJFrost/Lumison.git
cd Lumison

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 启动 Tauri 桌面应用
npm run tauri:dev
```

### 构建

```bash
# 构建网页版
npm run build

# 构建桌面应用
npm run tauri:build
```

## 🎹 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `空格` | 播放/暂停 |
| `→` | 下一首 |
| `←` | 上一首 |
| `↑` | 音量增加 |
| `↓` | 音量减少 |
| `Cmd/Ctrl + K` | 打开搜索 |
| `F` | 切换全屏 |
| `L` | 切换播放列表 |

## 🛠️ 技术栈

### 前端
- **React 19.2** - UI 框架
- **TypeScript 5.8** - 类型安全
- **Vite 6.2** - 构建工具
- **Tailwind CSS 3.4** - 样式框架

### 桌面端
- **Tauri 2.0** - 桌面应用框架
- **Rust** - 后端语言

### 核心库
- **@react-spring/web** - 动画库
- **jsmediatags** - 音频元数据解析
- **colorthief** - 颜色提取

## 📁 项目结构

```
Lumison/
├── src/                      # 源代码
│   ├── components/          # React 组件
│   │   ├── background/     # 背景动画
│   │   ├── controls/       # 播放控制
│   │   ├── lyrics/         # 歌词显示
│   │   └── visualizer/     # 音频可视化
│   ├── contexts/           # React Context
│   ├── hooks/              # 自定义 Hooks
│   ├── services/           # 业务逻辑
│   │   ├── animation/      # 动画系统
│   │   ├── audio/          # 音频处理
│   │   ├── lyrics/         # 歌词服务
│   │   └── music/          # 音乐服务
│   ├── i18n/               # 国际化
│   └── utils/              # 工具函数
├── src-tauri/              # Tauri 后端
├── docs/                   # 文档
└── public/                 # 静态资源
```

## 🔄 自动更新

桌面版包含自动更新功能：

1. 应用启动时会自动检查更新（3秒后）
2. 发现新版本时，右下角会显示通知
3. 点击"立即更新"开始下载
4. 下载完成后自动安装并重启

## 🌐 API 集成

### 网易云音乐 API
- 搜索歌曲
- 获取歌词
- 获取专辑封面

### 本地文件支持
- **ID3 标签读取** - 自动提取标题、艺术家、专辑信息
- **内嵌歌词优先** - 自动提取 MP3 (ID3v2) 和 FLAC 内嵌歌词（最高优先级）
- **在线歌词备用** - 无内嵌歌词时自动搜索在线API
- **LRC 文件支持** - 自动匹配同名 .lrc 歌词文件（作为最后备用）
- **专辑封面提取** - 支持内嵌封面和外部图片

**歌词优先级**: 内嵌ID3/FLAC歌词 > 在线API > 外部LRC文件

详见 [歌词系统文档](docs/LYRICS_SYSTEM.md)

## 🎨 主题定制

Lumison 支持深色和浅色主题，会根据专辑封面自动提取主题色。

## 📱 响应式设计

- **桌面端**: 双栏布局（控制面板 + 歌词）
- **移动端**: 单栏布局，支持左右滑动切换

## 🔧 配置

### 性能优化
- 自动降低特效以保持流畅性
- 可选的音频可视化器（关闭可节省 5-10MB 内存）
- 智能缓存策略

### 歌词设置
- 字体大小调节（24px - 80px）
- 渐变效果
- 发光效果
- 阴影效果

## 🔄 自动更新

桌面版包含自动更新功能：

1. 应用启动时自动检查更新（延迟 3 秒）
2. 发现新版本时，右下角会显示更新通知
3. 点击"立即更新"开始下载
4. 下载完成后自动安装并重启

## 📖 文档

- **[用户指南](docs/GUIDE.md)** - 功能说明和使用技巧
- **[开发指南](docs/DEVELOPMENT.md)** - 开发环境设置和贡献指南
- **[项目结构](docs/PROJECT_STRUCTURE.md)** - 详细的项目组织
- **[发布指南](docs/RELEASE_GUIDE.md)** - 如何发布新版本
- **[贡献指南](CONTRIBUTING.md)** - 如何为项目做贡献

完整的文档索引请查看 [docs/README.md](docs/README.md)。

## 🤝 贡献

欢迎贡献！请查看 [DEVELOPMENT.md](docs/DEVELOPMENT.md) 了解如何开始。

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- **Shader**: [Shadertoy - wdyczG](https://www.shadertoy.com/view/wdyczG)
- **设计灵感**: Apple Music

## ⭐ Star History

如果你喜欢这个项目，请给它一个 Star！

[![Star History Chart](https://api.star-history.com/svg?repos=SalixJFrost/Lumison&type=Date)](https://star-history.com/#SalixJFrost/Lumison&Date)

---

<div align="center">

**用 ❤️ 制作**

[⬆ 回到顶部](#lumison---视觉艺术音乐播放器)

</div>
