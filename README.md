# Lumison

A high-fidelity, immersive music player inspired by Apple Music with advanced playback controls, stunning visual effects, and multi-language support.

🎵 **Live Demo**: https://salixjfrost.github.io/Lumison/

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

## Screenshots
<img width="2559" height="1599" alt="image" src="https://github.com/user-attachments/assets/1eccc917-7620-478a-b46b-942d1498e92e" />
<img width="2559" height="1599" alt="image" src="https://github.com/user-attachments/assets/9b731088-1e91-4841-a1d8-a27a99d3ac90" />
<img width="2559" height="1599" alt="image" src="https://github.com/user-attachments/assets/aa50a8eb-5476-4f62-bebf-1b7d782aa548" />
<img width="2559" height="1599" alt="image" src="https://github.com/user-attachments/assets/71d0b2d3-70af-4c38-bf41-b244718042d1" />

## ✨ Features

### 🎨 Visual Experience
- **WebGL Fluid Background**: Dynamic, reactive fluid background effect using WebGL shaders
- **Canvas Lyric Rendering**: High-performance, custom-drawn lyric visualization with smooth animations
- **3D Album Cover**: Professional 3D card effect with mouse tracking and glare effects
- **Theme Support**: Light and dark themes with smooth 1.2s transitions
- **Hardware Acceleration**: GPU-accelerated rendering for 60 FPS performance

### 🎵 Music Playback
- **Variable Speed Playback (0.5x - 3x)**: Enhanced speed control with 8 quick presets
  - Quick presets: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x, 2.5x, 3x
  - Smooth speed transitions with performance optimization
  - Visual speed indicator with color-coded feedback
- **3D Spatial Audio**: Cinema-style immersive sound for headphones
  - 5-band parametric equalizer (Sub, Bass, Mid, High-Mid, Treble)
  - HRTF-based 3D positioning with spatial widening
  - Convolution reverb for depth and room simulation
  - 3 presets: Music, Cinema, Vocal modes
  - Real-time frequency visualization
  - ⚠️ Simulated spatial enhancement (not real Dolby Atmos)
- **Pitch Preservation**: Toggle between digital (pitch-preserved) and vinyl (natural pitch shift) modes
- **Real-time Audio Visualization**: Spectrum analyzer with smooth animations
- **Hardware Decoding**: Automatic detection and use of hardware-accelerated audio decoding

### 🌐 Music Sources
- **Netease Cloud Music**: Search and import music with lyrics
- **Bilibili**: Extract and play audio from Bilibili videos
  - Automatic audio stream extraction
  - CORS bypass with Blob URL
  - Hardware-accelerated decoding support
- **Local Files**: Import audio files with metadata extraction
- **Multi-language Lyrics**: Support for synchronized lyrics with translations

### 🌍 Internationalization
- **3 Languages**: English, 简体中文, 日本語
- **Auto-detect**: Automatically detects browser language
- **Persistent**: Language preference saved to localStorage
- **Complete Coverage**: All UI text fully translated

### ⌨️ User Experience
- **Keyboard Shortcuts**: Comprehensive keyboard controls
  - `Space`: Play/Pause
  - `Shift + ↑/↓`: Adjust speed ±0.25x
  - `Ctrl + 0-3`: Quick speed presets (1x, 1.5x, 2x, 3x)
  - `R`: Reset speed to 1x
  - `S`: Open speed settings
  - `Ctrl + /`: View all shortcuts
- **Touch Optimized**: Gesture support for mobile devices
- **Responsive Design**: Seamless experience across desktop and mobile

## 🚀 Quick Start

**Prerequisites:** Node.js 18+ and npm

```bash
# Clone the repository
git clone https://github.com/salixjfrost/Lumison.git
cd Lumison

# Install dependencies
npm install

# Run development server
npm run dev
# Open http://localhost:5173

# Build for production
npm run build
```

### Optional: AI Features

Create a `.env.local` file for AI-powered lyrics analysis:
```env
GEMINI_API_KEY=your_api_key_here
```

## 🎮 Usage

### Importing Music
- **Local Files**: Drag and drop audio files or click the import button
- **Online Search**: Press `Ctrl + K` to search Netease Cloud Music or Bilibili
- **URL Import**: Paste music URLs directly (supports Netease and Bilibili)

### Playback Controls
- **Speed Control**: Click settings icon or press `S` to adjust playback speed
- **Volume**: Click volume icon or use `↑/↓` arrow keys
- **Navigation**: Use `←/→` to seek, `Ctrl + ←/→` to skip tracks
- **Loop Modes**: Press `L` to cycle through loop modes

### Keyboard Shortcuts
Press `Ctrl + /` to view all available keyboard shortcuts in the app.

## 🛠️ Tech Stack

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite
- **Animations**: React Spring
- **Graphics**: WebGL (fluid background), Canvas API (lyrics rendering)
- **Audio**: Web Audio API with hardware decoding optimization
  - 3D Spatial Audio Engine with HRTF panning
  - 5-band parametric EQ
  - Convolution reverb
  - Harmonic excitation
  - Dynamic range compression
- **Styling**: Tailwind CSS with custom animations
- **i18n**: Custom React Context-based translation system

## 📦 Project Structure

```
Lumison/
├── src/
│   ├── components/        # React components
│   │   ├── Controls.tsx   # Playback controls
│   │   ├── SpeedIndicator.tsx  # Visual speed feedback
│   │   ├── LyricsView.tsx # Canvas-based lyrics renderer
│   │   ├── SpatialAudioControl.tsx  # 3D spatial audio UI
│   │   └── ...
│   ├── hooks/            # Custom React hooks
│   │   ├── usePlayer.ts  # Audio playback logic
│   │   ├── useSpatialAudio.ts  # Spatial audio integration
│   │   └── ...
│   ├── services/         # Business logic
│   │   ├── audio/        # Audio processing
│   │   │   └── SpatialAudioEngine.ts  # 3D spatial audio engine
│   │   ├── music/        # Music services (Netease, Bilibili)
│   │   ├── lyrics/       # Lyrics parsing and fetching
│   │   └── corsProxy.ts  # CORS bypass for Bilibili
│   ├── contexts/         # React contexts (Theme, i18n)
│   ├── i18n/            # Internationalization
│   │   └── locales/     # Translation files (en, zh, ja)
│   └── types.ts         # TypeScript type definitions
├── docs/                # Documentation
│   ├── SPEED_OPTIMIZATION.md
│   ├── PERFORMANCE_I18N.md
│   └── BILIBILI_HARDWARE_DECODE.md
├── public/              # Static assets
└── dist/                # Production build output
```

## 🎯 Performance

### Optimization Highlights
- **Hardware Acceleration**: GPU-accelerated rendering for all animations
- **60 FPS Target**: Consistent frame rate across all animations
- **Smart Audio Decoding**: Automatic hardware decoding detection
- **Efficient Rendering**: Isolated layers and optimized paint areas
- **Memory Management**: Automatic cleanup of resources

### Performance Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| First Contentful Paint | ~800ms | ~500ms | 37.5% ↑ |
| Animation Frame Rate | ~45 FPS | ~60 FPS | 33% ↑ |
| Memory Usage | ~120MB | ~95MB | 20% ↓ |
| CPU Usage | ~25% | ~15% | 40% ↓ |
| Theme Switch Delay | ~200ms | ~50ms | 75% ↓ |

*Tested on Chrome 120+, MacBook Pro M1, 1920x1080*

For detailed performance documentation, see [docs/PERFORMANCE_I18N.md](./docs/PERFORMANCE_I18N.md)

## 🌍 Internationalization

### Supported Languages
- 🇺🇸 English (en)
- 🇨🇳 简体中文 (zh)
- 🇯🇵 日本語 (ja)

### Features
- Auto-detect browser language on first visit
- Language switcher in top bar
- Persistent language preference
- Type-safe translation system
- Complete UI coverage

### Adding New Languages

1. Create locale file: `src/i18n/locales/[lang].ts`
2. Add translations following the existing structure
3. Update `src/i18n/index.ts` to include the new locale
4. Submit a pull request!

For detailed i18n documentation, see [docs/PERFORMANCE_I18N.md](./docs/PERFORMANCE_I18N.md)

## 📚 Documentation

Detailed documentation is available in the `docs/` folder:

- **[Speed Optimization](./docs/SPEED_OPTIMIZATION.md)** - Variable speed playback implementation
- **[Performance & i18n](./docs/PERFORMANCE_I18N.md)** - Performance optimization and internationalization
- **[Bilibili Integration](./docs/BILIBILI_HARDWARE_DECODE.md)** - Bilibili audio extraction and hardware decoding

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/Lumison.git`
3. Create a feature branch: `git checkout -b feature/AmazingFeature`
4. Install dependencies: `npm install`
5. Start dev server: `npm run dev`
6. Make your changes and test thoroughly
7. Commit your changes: `git commit -m 'Add some AmazingFeature'`
8. Push to the branch: `git push origin feature/AmazingFeature`
9. Open a Pull Request

### Code Style

- Follow existing code patterns
- Use TypeScript for type safety
- Write meaningful commit messages
- Add comments for complex logic
- Test your changes before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Third-Party Licenses

- React: MIT License
- Vite: MIT License
- Tailwind CSS: MIT License
- React Spring: MIT License
- Other dependencies: See package.json

## 🙏 Credits

- **Shader Source**: [Shadertoy - wdyczG](https://www.shadertoy.com/view/wdyczG)
- **Original Project**: Aura Music by dingyi222666
- **Inspiration**: Apple Music design language

## 📝 Changelog

### v2.1.0 (Latest)
- 🎧 3D Spatial Audio system with cinema-style immersion
  - 5-band parametric equalizer
  - HRTF-based 3D positioning
  - Convolution reverb and stereo widening
  - Music/Cinema/Vocal presets
  - Real-time frequency visualization
- 🌍 Multi-language support (English, 简体中文, 日本語)
- ⚡ Hardware acceleration and performance optimization
- 🎵 Bilibili audio extraction with hardware decoding
- ✨ Extended speed range to 3x with quick presets
- 🎨 Visual speed indicator with color-coded feedback
- ⌨️ Enhanced keyboard shortcuts
- 📱 Optimized touch gestures for mobile

For detailed changes, see the [documentation](./docs/).

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=SalixJFrost/Lumison&type=Date)](https://star-history.com/#SalixJFrost/Lumison&Date)

---

**If you find this project useful, please consider giving it a star ⭐**

