# Lumison - Visual Art Music Player

English | [简体中文](README.zh-CN.md)

<div align="center">

![Lumison Logo](public/icon.svg)

**A high-fidelity, immersive music player inspired by Apple Music**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tauri](https://img.shields.io/badge/Tauri-2.0-blue.svg)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-19.2-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)

[Live Demo](https://salixjfrost.github.io/Lumison/) | [Download Desktop](https://github.com/SalixJFrost/Lumison/releases) | [Documentation](docs/GUIDE.md)

</div>

## Screenshots
<img width="2559" height="1599" alt="image" src="https://github.com/user-attachments/assets/df80ac38-cad1-440f-8d53-02f959c67822" />

## ✨ Key Features

### 🎵 Core Functionality
- **High-fidelity music playback** - Support for multiple formats (MP3, FLAC, WAV, etc.)
- **Fluid background animation** - Dynamic background that responds to music and album art
- **Synchronized lyrics display** - Smooth scrolling with physics-based animations
- **Playlist management** - Drag-and-drop support
- **Search integration** - Netease Cloud Music API integration

### 🎨 Visual Experience
- **Frameless window design** - Modern aesthetics
- **Responsive layout** - Desktop and mobile support
- **Dark/Light theme** - Automatic switching
- **Multi-language support** - English, Chinese, Japanese
- **Smooth animations** - 60fps performance optimization

### 🎧 Audio Features
- **Variable playback speed** (0.25x - 2.0x) with pitch preservation
- **Volume control** with visual feedback
- **Audio visualization** (optional, can be disabled to save memory)
- **Spatial audio engine** for immersive experience
- **Smart format detection** and error handling

### 💻 Desktop Integration
- Native window controls (minimize, maximize, close)
- System tray integration
- Media session API support
- **Auto-update functionality** (silent check on startup)
- 📊 **Real-time Visualizer** - Spectrum analyzer with enhanced animations
- 🌐 **Multi-platform** - Netease Cloud Music, Internet Archive, and local files
- 🌍 **i18n Support** - English, 简体中文 (Simplified Chinese), 日本語 (Japanese)
- ⌨️ **Keyboard Shortcuts** - Comprehensive keyboard controls
- 📱 **Responsive Design** - Optimized for desktop and mobile

## 📦 Installation

### Windows Desktop

Download the latest version from [Releases](https://github.com/SalixJFrost/Lumison/releases):

- **MSI Installer** (recommended for enterprise): `Lumison_x.x.x_x64_en-US.msi`
- **NSIS Installer** (smaller, faster): `Lumison_x.x.x_x64-setup.exe`

Double-click to install. The application will be installed to `C:\Program Files\Lumison\`.

### Web Version

Visit: https://salixjfrost.github.io/Lumison/

No installation required, works in your browser.

## 🚀 Quick Start

### Development

```bash
# Clone repository
git clone https://github.com/SalixJFrost/Lumison.git
cd Lumison

# Install dependencies
npm install

# Start development server
npm run dev

# Start Tauri desktop app
npm run tauri:dev
```

### Building

See [BUILD.md](docs/BUILD.md) for detailed build instructions for all platforms.

#### Quick Build Commands

```bash
# Build web version
npm run build

# Build for current platform (Windows/macOS/Linux)
npm run tauri:build

# Build for specific platforms
npm run tauri:build:windows   # Windows (NSIS + MSI)
npm run tauri:build:macos      # macOS (Universal DMG)
npm run tauri:build:linux      # Linux (AppImage + deb)
npm run tauri:build:android    # Android (APK + AAB)

# Or use the build scripts
./build.sh macos      # macOS/Linux
.\build.ps1 windows   # Windows PowerShell
```

#### Platform-Specific Requirements

- **Windows**: Visual Studio 2022 with C++ build tools
- **macOS**: Xcode Command Line Tools
- **Linux**: WebKit2GTK and other system libraries
- **Android**: Android Studio, SDK, NDK, and JDK 17+

See [BUILD.md](docs/BUILD.md) for complete setup instructions.
```

## 🎹 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Space` | Play/Pause |
| `→` | Next track |
| `←` | Previous track |
| `↑` | Volume up |
| `↓` | Volume down |
| `Cmd/Ctrl + K` | Open search |
| `F` | Toggle fullscreen |
| `L` | Toggle playlist |

## 🎮 Usage

### Import Music
- **Local Files**: Drag and drop or click import button
  - Automatically extracts ID3/FLAC metadata (title, artist, album, cover)
  - Embedded lyrics priority: Reads lyrics from ID3v2 (MP3) and Vorbis Comments (FLAC) - highest priority
  - Online lyrics fallback: Searches online APIs when no embedded lyrics found
  - Auto-matches .lrc files with same filename (last resort fallback)
  - **Lyrics Priority**: Embedded ID3/FLAC lyrics > Online API > External LRC file
- **Online Search**: Press `Ctrl + K` to search Netease Cloud Music
- **URL Import**: Paste direct audio URLs

See [Lyrics System Documentation](docs/LYRICS_SYSTEM.md) for details.

### Playback Controls
- Variable speed (0.25x - 2.0x) with pitch preservation
- Volume control with visual feedback
- Play modes: Sequential, Loop, Shuffle
- Audio visualization (optional)

## 🛠️ Tech Stack

### Frontend
- **React 19.2** - UI framework
- **TypeScript 5.8** - Type safety
- **Vite 6.2** - Build tool
- **Tailwind CSS 3.4** - Styling framework

### Desktop
- **Tauri 2.0** - Desktop application framework
- **Rust** - Backend language

### Core Libraries
- **@react-spring/web** - Animation library
- **jsmediatags** - Audio metadata parsing
- **colorthief** - Color extraction

## 📁 Project Structure

```
Lumison/
├── src/                      # Source code
│   ├── components/          # React components
│   │   ├── background/     # Background animation
│   │   ├── controls/       # Playback controls
│   │   ├── lyrics/         # Lyrics display
│   │   └── visualizer/     # Audio visualization
│   ├── contexts/           # React Context
│   ├── hooks/              # Custom Hooks
│   ├── services/           # Business logic
│   │   ├── animation/      # Animation system
│   │   ├── audio/          # Audio processing
│   │   ├── lyrics/         # Lyrics service
│   │   └── music/          # Music service
│   ├── i18n/               # Internationalization
│   └── utils/              # Utility functions
├── src-tauri/              # Tauri backend
├── docs/                   # Documentation
└── public/                 # Static assets
```

## 🔄 Auto-Update

Desktop version includes auto-update functionality:

1. App checks for updates on startup (after 3 seconds)
2. When a new version is available, a notification appears in the bottom-right corner
3. Click "Update Now" to download
4. Automatically installs and restarts after download

## 📚 Documentation

- **[User Guide](docs/GUIDE.md)** - Feature descriptions and usage tips
- **[Development Guide](docs/DEVELOPMENT.md)** - Development setup and contribution guide
- **[Project Structure](docs/PROJECT_STRUCTURE.md)** - Detailed project organization
- **[Release Guide](docs/RELEASE_GUIDE.md)** - How to publish new versions
- **[Contributing](CONTRIBUTING.md)** - How to contribute to the project

For a complete documentation index, see [docs/README.md](docs/README.md).

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Credits

- **Shader**: [Shadertoy - wdyczG](https://www.shadertoy.com/view/wdyczG)
- **Inspiration**: Apple Music design language

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=SalixJFrost/Lumison&type=Date)](https://star-history.com/#SalixJFrost/Lumison&Date)

---

**If you find this project useful, please consider giving it a star ⭐**

---

<div align="center">

**Made with ❤️**

[⬆ Back to top](#lumison---visual-art-music-player)

</div>
