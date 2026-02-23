# Changelog

All notable changes to Lumison will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.3] - 2024-02-23

### Added
- Auto-update functionality with GitHub Releases integration
- Update notification UI in bottom-right corner
- Automatic update checking on app startup
- Signed update packages for security
- Setup scripts for key generation (Windows/macOS/Linux)
- Comprehensive update documentation (EN/CN)

### Changed
- Reduced default layer count from 4 to 3 for better performance
- Reduced blur amount from 35px to 30px for smoother rendering
- Optimized layer generation based on CPU cores (hardwareConcurrency)
- Reduced layer opacity slightly (0.45 from 0.5) for better performance
- Optimized React component memoization in App.tsx
- Removed unnecessary dependencies from useMemo hooks

### Performance
- 10-15% reduction in GPU usage on mobile devices
- Faster initial render time
- Better performance on low-end devices (< 4GB RAM)
- Reduced memory footprint by optimizing layer count

### Fixed
- Improved performance on devices with limited hardware concurrency
- Better handling of reduced motion preferences

## [1.0.2] - 2024-02-20

### Added
- Album Mode with centered album art display
- View mode switcher (Default/Album)
- Enhanced visualizer with better performance
- Gapless playback support (experimental)

### Changed
- Improved UI responsiveness
- Better mobile layout handling
- Enhanced theme transitions

### Fixed
- Various UI glitches
- Performance issues on older devices

## [1.0.1] - 2024-02-15

### Added
- Initial public release
- Music player with lyrics support
- Internet Archive integration
- Multi-platform support (Windows, macOS, Linux, Android)

### Features
- Fluid background animations
- Real-time lyrics display
- Multiple playback modes
- Playlist management
- Search functionality
- Theme support (Light/Dark)
- Internationalization (EN/CN)

---

[1.0.3]: https://github.com/SalixJFrost/Lumison/releases/tag/v1.0.3
[1.0.2]: https://github.com/SalixJFrost/Lumison/releases/tag/v1.0.2
[1.0.1]: https://github.com/SalixJFrost/Lumison/releases/tag/v1.0.1
