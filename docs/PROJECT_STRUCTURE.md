# Lumison Project Structure

This document provides an overview of the Lumison project structure and organization.

## 📁 Directory Structure

```
Lumison/
├── .github/                    # GitHub workflows and configurations
├── .kiro/                      # Kiro IDE configurations
│   ├── settings/              # IDE settings
│   └── specs/                 # Project specifications
├── docs/                       # Documentation
│   ├── README.md              # Documentation index
│   ├── QUICK_REFERENCE.md     # Quick start guide
│   ├── MIGRATION_GUIDE.md     # Version migration guide
│   ├── AUDIO_SOURCES.md       # Audio format documentation
│   ├── AUDIO_FORMATS.md       # Format specifications
│   ├── LYRICS_EFFECTS.md      # Lyrics system documentation
│   ├── TAURI_INTEGRATION.md   # Desktop app guide
│   ├── TAILWIND_SETUP.md      # Tailwind configuration
│   ├── FRAMELESS_WINDOW.md    # Window controls guide
│   ├── UI_IMPROVEMENTS.md     # UI/UX guidelines
│   └── PERFORMANCE_BEST_PRACTICES.md  # Performance guide
├── public/                     # Static assets
│   ├── icon.svg               # App icon (animated)
│   ├── icon-static.svg        # App icon (static)
│   └── manifest.json          # PWA manifest
├── src/                        # Source code
│   ├── components/            # React components
│   │   ├── background/        # Background rendering
│   │   │   ├── mobile/        # Mobile-specific background
│   │   │   └── renderer/      # Background renderers
│   │   ├── controls/          # Playback controls
│   │   │   ├── index.tsx      # Main controls component
│   │   │   ├── CoverCard.tsx  # Album cover with 3D effect
│   │   │   └── ProgressBar.tsx # Progress bar component
│   │   ├── lyrics/            # Lyrics rendering
│   │   │   ├── ILyricLine.ts  # Lyric line interface
│   │   │   ├── LyricLine.ts   # Lyric line implementation
│   │   │   └── InterludeDots.ts # Interlude animation
│   │   ├── visualizer/        # Audio visualizer
│   │   │   ├── Visualizer.tsx # Main visualizer component
│   │   │   ├── AudioProcessor.ts # Audio analysis
│   │   │   └── VisualizerWorker.ts # Web Worker for processing
│   │   ├── AboutDialog.tsx    # About dialog
│   │   ├── Controls.tsx       # Legacy controls (deprecated)
│   │   ├── FluidBackground.tsx # Fluid background component
│   │   ├── GeminiButton.tsx   # AI integration button
│   │   ├── Icons.tsx          # Icon components
│   │   ├── ImportMusicDialog.tsx # Music import dialog
│   │   ├── KeyboardShortcuts.tsx # Keyboard handler
│   │   ├── LanguageSwitcher.tsx # Language selector
│   │   ├── LyricsView.tsx     # Lyrics display
│   │   ├── MediaSessionController.tsx # Media session API
│   │   ├── PlaylistPanel.tsx  # Playlist UI
│   │   ├── SearchModal.tsx    # Search interface
│   │   ├── SmartImage.tsx     # Optimized image loader
│   │   ├── SpeedIndicator.tsx # Speed change indicator
│   │   ├── StreamingStatus.tsx # Streaming status
│   │   ├── Toast.tsx          # Toast notifications
│   │   └── TopBar.tsx         # Top navigation bar
│   ├── config/                # Configuration files
│   │   ├── performance.ts     # Performance settings
│   │   └── streaming.ts       # Streaming configuration
│   ├── contexts/              # React contexts
│   │   ├── I18nContext.tsx    # Internationalization
│   │   ├── PlayerContext.tsx  # Player state (deprecated)
│   │   └── ThemeContext.tsx   # Theme management
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAnimationFrame.ts # Animation frame hook
│   │   ├── useCanvasRenderer.ts # Canvas rendering hook
│   │   ├── useClickOutside.ts # Click outside detection
│   │   ├── useDebounce.ts     # Debounce hook
│   │   ├── useKeyboardScope.ts # Keyboard scope management
│   │   ├── useLyricsPhysics.ts # Lyrics physics simulation
│   │   ├── useNeteaseSearchProvider.ts # Netease search
│   │   ├── usePerformanceOptimization.ts # Performance monitoring
│   │   ├── usePlayer.ts       # Player logic
│   │   ├── usePlaylist.ts     # Playlist management
│   │   ├── useQueueSearchProvider.ts # Queue search
│   │   ├── useSearchModal.ts  # Search modal state
│   │   ├── useSearchProvider.ts # Search provider interface
│   │   ├── useSpatialAudio.ts # Spatial audio hook
│   │   └── useToast.ts        # Toast notifications
│   ├── i18n/                  # Internationalization
│   │   ├── index.ts           # i18n setup
│   │   └── locales/           # Translation files
│   │       ├── en.ts          # English
│   │       ├── ja.ts          # Japanese
│   │       └── zh.ts          # Chinese
│   ├── services/              # Business logic services
│   │   ├── animation/         # Animation utilities
│   │   │   ├── index.ts       # Animation exports
│   │   │   ├── spring.ts      # Spring physics
│   │   │   └── springSystem.ts # Spring system
│   │   ├── audio/             # Audio processing
│   │   │   └── SpatialAudioEngine.ts # Spatial audio
│   │   ├── lyrics/            # Lyrics services
│   │   │   ├── index.ts       # Lyrics exports
│   │   │   ├── lrc.ts         # LRC parser
│   │   │   ├── netease.ts     # Netease lyrics API
│   │   │   ├── parser.ts      # Lyrics parser
│   │   │   ├── translation.ts # Translation service
│   │   │   ├── types.ts       # Lyrics types
│   │   │   └── utils.ts       # Lyrics utilities
│   │   ├── music/             # Music services
│   │   │   ├── audioStreamService.ts # Audio streaming
│   │   │   ├── geminiService.ts # AI integration
│   │   │   ├── index.ts       # Music exports
│   │   │   ├── lyricsService.ts # Lyrics service
│   │   │   └── multiPlatformLyrics.ts # Multi-platform lyrics
│   │   ├── ui/                # UI services
│   │   │   ├── index.ts       # UI exports
│   │   │   └── keyboardRegistry.ts # Keyboard registry
│   │   ├── cache.ts           # Caching service
│   │   ├── corsProxy.ts       # CORS proxy
│   │   ├── index.ts           # Services exports
│   │   ├── streamingProxy.ts  # Streaming proxy
│   │   └── utils.ts           # Utility functions
│   ├── utils/                 # Utility functions
│   │   ├── memoize.ts         # Memoization utilities
│   │   ├── performance.ts     # Performance utilities (deprecated)
│   │   └── performanceMonitor.ts # Performance monitoring
│   ├── App.tsx                # Main application component
│   ├── env.d.ts               # TypeScript environment definitions
│   ├── index.css              # Global styles
│   ├── index.tsx              # Application entry point
│   └── types.ts               # TypeScript type definitions
├── src-tauri/                 # Tauri desktop application
│   ├── gen/                   # Generated files
│   ├── icons/                 # Application icons
│   ├── src/                   # Rust source code
│   ├── build.rs               # Build script
│   ├── Cargo.lock             # Rust dependencies lock
│   ├── Cargo.toml             # Rust dependencies
│   └── tauri.conf.json        # Tauri configuration
├── tests/                     # Test files
│   └── tauri-integration.unit.test.ts # Tauri tests
├── .gitignore                 # Git ignore rules
├── index.html                 # HTML entry point
├── package.json               # Node.js dependencies
├── package-lock.json          # Dependencies lock file
├── postcss.config.js          # PostCSS configuration
├── PROJECT_STRUCTURE.md       # This file
├── README.md                  # Project README
├── tailwind.config.js         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite configuration
└── vitest.config.ts           # Vitest configuration
```

## 🎯 Key Directories

### `/src/components`
React components organized by feature:
- **background/** - Background rendering with mobile and desktop variants
- **controls/** - Playback controls split into smaller components
- **lyrics/** - Lyrics rendering with physics-based animations
- **visualizer/** - Audio visualization with Web Worker processing

### `/src/hooks`
Custom React hooks for reusable logic:
- Performance optimization hooks
- Audio processing hooks
- UI interaction hooks
- State management hooks

### `/src/services`
Business logic separated from UI:
- **animation/** - Spring physics and animation utilities
- **audio/** - Spatial audio and audio processing
- **lyrics/** - Lyrics fetching, parsing, and translation
- **music/** - Music streaming and platform integration
- **ui/** - UI utilities like keyboard management

### `/src/config`
Configuration files for:
- Performance settings
- Streaming configuration
- Feature flags

### `/docs`
Comprehensive documentation:
- User guides
- Developer guides
- API documentation
- Performance guides

## 🔧 Configuration Files

### Build & Development
- **vite.config.ts** - Vite bundler configuration
- **tsconfig.json** - TypeScript compiler options
- **tailwind.config.js** - Tailwind CSS customization
- **postcss.config.js** - PostCSS plugins

### Desktop Application
- **src-tauri/tauri.conf.json** - Tauri app configuration
- **src-tauri/Cargo.toml** - Rust dependencies

### Testing
- **vitest.config.ts** - Vitest test runner configuration

## 📦 Key Dependencies

### Frontend
- **React 19** - UI framework
- **TypeScript 5** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Spring** - Animations

### Desktop
- **Tauri 2** - Desktop framework
- **Rust** - Backend language

### Audio
- **Web Audio API** - Audio processing
- **MediaSession API** - Media controls

## 🚀 Development Workflow

### Web Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Desktop Development
```bash
npm run tauri:dev    # Start desktop app in dev mode
npm run tauri:build  # Build desktop application
```

### Testing
```bash
npm run test         # Run tests
npm run test:ui      # Run tests with UI
```

## 📝 Code Organization Principles

### 1. Component Structure
- Keep components small and focused
- Use composition over inheritance
- Separate logic from presentation

### 2. State Management
- Use React Context for global state
- Keep local state when possible
- Avoid prop drilling

### 3. Performance
- Memoize expensive calculations
- Use React.memo for pure components
- Implement code splitting

### 4. Type Safety
- Use TypeScript for all code
- Define interfaces for props
- Avoid `any` type

### 5. Documentation
- Document complex logic
- Keep README files updated
- Add JSDoc comments for public APIs

## 🔄 Recent Changes

### Cleanup (2026-02-22)
- Removed debug components
- Consolidated documentation
- Deleted temporary test files
- Organized project structure

### Performance Optimization
- Added performance monitoring
- Implemented memory management
- Optimized rendering pipeline
- Added adaptive quality settings

## 📚 Additional Resources

- [Contributing Guidelines](./CONTRIBUTING.md) - How to contribute
- [Code of Conduct](./CODE_OF_CONDUCT.md) - Community guidelines
- [License](./LICENSE) - MIT License

---

**Last Updated**: 2026-02-22
