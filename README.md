# Lumison

A high-fidelity, immersive music player inspired by Apple Music with advanced playback controls and stunning visual effects.

🎵 **Live Demo**: https://salixjfrost.github.io/Lumison/

## Screenshots
<img width="2559" height="1599" alt="image" src="https://github.com/user-attachments/assets/1eccc917-7620-478a-b46b-942d1498e92e" />
<img width="2559" height="1599" alt="image" src="https://github.com/user-attachments/assets/9b731088-1e91-4841-a1d8-a27a99d3ac90" />
<img width="2559" height="1599" alt="image" src="https://github.com/user-attachments/assets/aa50a8eb-5476-4f62-bebf-1b7d782aa548" />
<img width="2559" height="1599" alt="image" src="https://github.com/user-attachments/assets/71d0b2d3-70af-4c38-bf41-b244718042d1" />

## ✨ Features

### Core Features
- **WebGL Fluid Background**: Dynamic, reactive fluid background effect using WebGL shaders. [Reference](https://www.shadertoy.com/view/wdyczG)
- **Canvas Lyric Rendering**: High-performance, custom-drawn lyric visualization with smooth animations on HTML5 Canvas
- **Music Import & Search**: Seamlessly search and import music from Netease Cloud Music or Bilibili
- **3D Album Cover**: Professional 3D card effect with mouse tracking and glare effects
- **Multi-language Lyrics**: Support for synchronized lyrics with translations and metadata

### Advanced Playback Controls
- **Variable Speed Playback (0.5x - 3x)**: Enhanced speed control with 8 quick presets
  - Quick presets: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x, 2.5x, 3x
  - Smooth speed transitions with performance optimization
  - Visual speed indicator with color-coded feedback
- **Pitch Preservation**: Toggle between digital (pitch-preserved) and vinyl (natural pitch shift) modes
- **Real-time Audio Visualization**: Spectrum analyzer with smooth animations

### User Experience
- **Keyboard Shortcuts**: Comprehensive keyboard controls for efficient navigation
  - `Space`: Play/Pause
  - `Shift + ↑/↓`: Adjust speed ±0.25x
  - `Ctrl + 0-3`: Quick speed presets (1x, 1.5x, 2x, 3x)
  - `R`: Reset speed to 1x
  - `S`: Open speed settings
  - And more... (Press `Ctrl + /` to view all shortcuts)
- **Touch Optimized**: Gesture support for mobile devices with responsive design
- **Theme Support**: Light and dark themes with smooth transitions
- **Responsive Design**: Seamless experience across desktop and mobile devices

## 🚀 Quick Start

**Prerequisites:** Node.js 18+ and npm

1. **Clone the repository**
   ```bash
   git clone https://github.com/salixjfrost/Lumison.git
   cd Lumison
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **(Optional) Configure AI features**
   
   Create a `.env.local` file and set your `GEMINI_API_KEY` for AI-powered lyrics analysis:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```
   Open http://localhost:5173 in your browser

5. **Build for production**
   ```bash
   npm run build
   ```
   The built files will be in the `dist` directory

## 🎮 Usage

### Importing Music
1. **Local Files**: Drag and drop audio files or click the import button
2. **Online Search**: Press `Ctrl + K` to search Netease Cloud Music or Bilibili
3. **URL Import**: Paste music URLs directly

### Playback Controls
- **Speed Control**: Click the settings icon or press `S` to adjust playback speed
  - Use the vertical slider for precise control
  - Click "Speed" to access quick presets
  - Use `Shift + ↑/↓` for keyboard adjustment
- **Volume**: Click the volume icon or use `↑/↓` arrow keys
- **Navigation**: Use `←/→` to seek, `Ctrl + ←/→` to skip tracks
- **Loop Modes**: Press `L` to cycle through loop modes

### Keyboard Shortcuts
Press `Ctrl + /` to view all available keyboard shortcuts in the app.

## 🛠️ Tech Stack

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Animations**: React Spring
- **Graphics**: WebGL (fluid background), Canvas API (lyrics rendering)
- **Audio Processing**: Web Audio API with custom playback rate optimization
- **Styling**: Tailwind CSS with custom animations

## 📦 Project Structure

```
Lumison/
├── src/
│   ├── components/        # React components
│   │   ├── Controls.tsx   # Playback controls with speed settings
│   │   ├── SpeedIndicator.tsx  # Visual speed feedback
│   │   ├── LyricsView.tsx # Canvas-based lyrics renderer
│   │   └── ...
│   ├── hooks/            # Custom React hooks
│   │   ├── usePlayer.ts  # Audio playback logic
│   │   └── ...
│   ├── services/         # Business logic and utilities
│   └── types.ts          # TypeScript type definitions
├── public/               # Static assets
└── dist/                 # Production build output
```

## 🎯 Performance Optimizations

- **Smooth Speed Transitions**: Uses `requestAnimationFrame` for gradual speed changes
- **Optimized High-Speed Playback**: Special handling for speeds > 2x
- **Efficient Canvas Rendering**: Hardware-accelerated lyrics animation
- **Resource Management**: Automatic cleanup of timers and animation frames
- **Lazy Loading**: Components load on-demand to reduce initial bundle size

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Credits

- **Shader Source**: https://www.shadertoy.com/view/wdyczG
- **Original Project**: Aura Music by dingyi222666
- **Inspiration**: Apple Music design language

## 📝 Changelog

### Latest Updates
- ✨ Extended speed range to 3x with 8 quick presets
- 🎨 Added visual speed indicator with color-coded feedback
- ⌨️ Enhanced keyboard shortcuts for speed control
- 📱 Optimized touch gestures for mobile devices
- ⚡ Performance improvements for high-speed playback
- 🎯 Smooth speed transitions with requestAnimationFrame

For detailed changes, see [SPEED_OPTIMIZATION.md](./SPEED_OPTIMIZATION.md)

---

Made with ❤️ by the Lumison team

