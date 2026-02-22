# Lumison - Project Overview

## 🎵 What is Lumison?

Lumison is a high-fidelity, immersive music player that combines stunning visual effects with advanced audio processing. Built with modern web technologies, it offers a premium music listening experience inspired by Apple Music.

## 🎯 Core Features

### Audio
- **Variable Speed Playback** (0.5x-3x) with pitch preservation
- **3D Spatial Audio** with 5-band equalizer
- **Real-time Visualizer** with spectrum analysis
- **Multi-format Support** (MP3, FLAC, WAV, OGG, M4A, AAC)

### Visual
- **WebGL Fluid Background** with GPU acceleration
- **Physics-based Lyrics** with smooth animations
- **3D Album Cover** with interactive effects
- **Adaptive Themes** (Light/Dark mode)

### Platform
- **Web Application** - Works in any modern browser
- **Desktop Application** - Native Windows app with Tauri
- **Mobile Responsive** - Optimized for touch devices

### Integration
- **Netease Cloud Music** - Search and stream
- **Internet Archive** - Access public domain music
- **Local Files** - Import your music library
- **URL Import** - Direct audio file URLs

## 🏗️ Architecture

### Frontend Stack
```
React 19 + TypeScript
├── UI Framework: React with Hooks
├── Styling: Tailwind CSS
├── Animation: React Spring
├── Build Tool: Vite
└── State: Context API
```

### Audio Pipeline
```
Audio Source → Web Audio API → Spatial Audio Engine → Output
                    ↓
              Visualizer (Web Worker)
                    ↓
              Real-time Spectrum Analysis
```

### Rendering Pipeline
```
Background: WebGL/Canvas (OffscreenCanvas + Web Worker)
Lyrics: Canvas with Physics Simulation
Controls: React Components with Hardware Acceleration
```

## 📊 Performance Targets

| Metric | Target | Actual |
|--------|--------|--------|
| FPS | 60 | 60 |
| Audio Latency | <50ms | ~30ms |
| Memory Usage | <500MB | ~300MB |
| Initial Load | <2s | ~1.5s |

## 🔧 Technology Highlights

### Performance Optimizations
- **Hardware Acceleration** - GPU compositing for smooth animations
- **Web Workers** - Offload heavy processing from main thread
- **Memory Management** - LRU caching and automatic cleanup
- **Code Splitting** - Lazy loading for faster initial load
- **Adaptive Quality** - Adjusts based on device capabilities

### Audio Processing
- **Low Latency** - Interactive audio context with 48kHz sample rate
- **Spatial Audio** - HRTF-based 3D positioning
- **Real-time Analysis** - FFT-based spectrum analysis
- **Pitch Preservation** - Maintains pitch during speed changes

### Visual Effects
- **Fluid Simulation** - WebGL-based fluid dynamics
- **Physics Engine** - Spring-based animations for lyrics
- **Color Extraction** - Dynamic theming from album art
- **Blur Effects** - Optimized backdrop filters

## 📁 Project Structure

```
Lumison/
├── src/
│   ├── components/     # React components
│   ├── hooks/          # Custom hooks
│   ├── services/       # Business logic
│   ├── utils/          # Utilities
│   └── config/         # Configuration
├── src-tauri/          # Desktop app (Rust)
├── docs/               # Documentation
└── public/             # Static assets
```

## 🚀 Development

### Quick Start
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start desktop app
npm run tauri:dev
```

### Key Commands
```bash
npm run dev           # Web development
npm run tauri:dev     # Desktop development
npm run build         # Production build
npm run tauri:build   # Desktop build
npm run test          # Run tests
```

## 🎨 Design Philosophy

### User Experience
- **Minimal UI** - Focus on music, not controls
- **Smooth Animations** - 60fps throughout
- **Intuitive Controls** - Keyboard shortcuts for power users
- **Responsive Design** - Works on all screen sizes

### Code Quality
- **Type Safety** - TypeScript everywhere
- **Performance First** - Optimize for 60fps
- **Clean Code** - Small, focused components
- **Well Documented** - Comprehensive docs

### Accessibility
- **Keyboard Navigation** - Full keyboard support
- **Reduced Motion** - Respects user preferences
- **Screen Readers** - ARIA labels and semantic HTML
- **High Contrast** - Readable in all themes

## 🌍 Internationalization

Supported Languages:
- 🇺🇸 English
- 🇨🇳 简体中文 (Simplified Chinese)
- 🇯🇵 日本語 (Japanese)

## 📈 Roadmap

### Near Term (Q1 2026)
- [ ] PWA support with offline playback
- [ ] Playlist import/export
- [ ] Lyrics editor
- [ ] Custom themes

### Mid Term (Q2-Q3 2026)
- [ ] macOS and Linux desktop apps
- [ ] Cloud sync
- [ ] Social features
- [ ] Plugin system

### Long Term (Q4 2026+)
- [ ] Mobile apps (iOS/Android)
- [ ] Streaming service integration
- [ ] AI-powered recommendations
- [ ] Collaborative playlists

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

### Areas for Contribution
- **Features** - New functionality
- **Performance** - Optimization improvements
- **Documentation** - Guides and tutorials
- **Translations** - New language support
- **Bug Fixes** - Issue resolution

## 📄 License

MIT License - Free for personal and commercial use.

## 🙏 Acknowledgments

- **Shader** - [Shadertoy wdyczG](https://www.shadertoy.com/view/wdyczG)
- **Design** - Inspired by Apple Music
- **Community** - All contributors and users

## 📞 Support

- **Documentation** - [docs/](../docs/)
- **Issues** - [GitHub Issues](https://github.com/SalixJFrost/Lumison/issues)
- **Discussions** - [GitHub Discussions](https://github.com/SalixJFrost/Lumison/discussions)

---

**Built with ❤️ by the Lumison team**
