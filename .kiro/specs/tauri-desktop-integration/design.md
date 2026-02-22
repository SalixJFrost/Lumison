# Design Document: Tauri Desktop Integration

## Overview

This design document specifies the architecture and implementation approach for integrating Tauri into the existing Lumison project. Lumison is a sound-driven generative visual art engine built with React, TypeScript, WebGL, and Web Audio API, currently deployed as a web application on GitHub Pages.

The integration will enable Lumison to run as a native desktop application on Windows while maintaining full compatibility with the existing web deployment. The design prioritizes minimal disruption to the current codebase, clear separation between web and desktop build modes, and extensibility for future system-level features.

### Design Goals

1. **Zero Frontend Changes**: The existing frontend code should work without modification in both web and desktop contexts
2. **Dual Build Support**: Maintain separate build pipelines for GitHub Pages (web) and desktop application
3. **Minimal Rust Backend**: Start with a minimal Tauri backend that only handles window management
4. **Future Extensibility**: Provide clear architectural hooks for system audio capture, multi-screen output, and exhibition mode
5. **Developer Experience**: Preserve hot reload, debugging tools, and familiar development workflows

### Non-Goals

- Implementing system audio capture (future extension)
- Implementing multi-screen output (future extension)
- Implementing exhibition mode (future extension)
- Cross-platform builds beyond Windows (initial scope)
- Modifying existing frontend functionality

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Lumison Application                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           Frontend (React + TypeScript)               │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  UI Components (Controls, Visualizer, etc.)     │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Services (Audio, Music, Streaming, etc.)       │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Web APIs (Web Audio, WebGL, Canvas, File)      │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│                            │                                  │
│                            │ (No changes required)            │
│                            │                                  │
├────────────────────────────┼──────────────────────────────────┤
│                            │                                  │
│  ┌─────────────────────────▼───────────────────────────────┐ │
│  │              Runtime Environment                        │ │
│  │                                                          │ │
│  │  Web Mode:          │  Desktop Mode:                    │ │
│  │  ┌──────────────┐   │  ┌──────────────────────────────┐ │ │
│  │  │   Browser    │   │  │   Tauri WebView (WRY)        │ │ │
│  │  │   (Chrome,   │   │  │   - Chromium-based           │ │ │
│  │  │   Firefox)   │   │  │   - Full Web API support     │ │ │
│  │  └──────────────┘   │  └──────────────────────────────┘ │ │
│  │                     │  ┌──────────────────────────────┐ │ │
│  │                     │  │   Tauri Core (Rust)          │ │ │
│  │                     │  │   - Window management        │ │ │
│  │                     │  │   - Extension hooks          │ │ │
│  │                     │  └──────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
lumison/
├── src/                          # Frontend source code (unchanged)
│   ├── components/
│   ├── services/
│   ├── contexts/
│   ├── hooks/
│   ├── utils/
│   ├── i18n/
│   ├── App.tsx
│   └── index.tsx
├── src-tauri/                    # Tauri backend (new)
│   ├── src/
│   │   └── main.rs              # Rust entry point
│   ├── icons/                    # Application icons
│   │   ├── icon.ico             # Windows icon
│   │   ├── icon.png             # Base icon
│   │   └── ...                  # Other icon sizes
│   ├── Cargo.toml               # Rust dependencies
│   ├── tauri.conf.json          # Tauri configuration
│   └── build.rs                 # Build script (if needed)
├── public/                       # Static assets (unchanged)
├── dist/                         # Build output
│   ├── web/                     # GitHub Pages build
│   └── desktop/                 # Tauri build (in target/)
├── docs/
│   └── TAURI_INTEGRATION.md     # Integration documentation
├── index.html                    # HTML entry point
├── package.json                  # Node dependencies + scripts
├── vite.config.ts               # Vite configuration
└── tsconfig.json                # TypeScript configuration
```

## Components and Interfaces

### Build System Configuration

#### package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  },
  "dependencies": {
    "@tauri-apps/api": "^2.0.0",
    // ... existing dependencies
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0",
    // ... existing devDependencies
  }
}
```

#### Vite Configuration Enhancement

The existing `vite.config.ts` will be enhanced to detect Tauri mode:

```typescript
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isTauri = process.env.TAURI_ENV_PLATFORM !== undefined;
  const productionBase = env.VITE_BASE_PATH || '/Lumison/';
  
  return {
    // Use root path for Tauri, GitHub Pages path for web
    base: isTauri ? '/' : (mode === 'production' ? productionBase : '/'),
    
    // Tauri uses a different server configuration
    server: {
      port: isTauri ? 1420 : 3000,
      host: '0.0.0.0',
      strictPort: true,
    },
    
    // ... rest of configuration
  };
});
```

### Tauri Configuration

#### tauri.conf.json Structure

```json
{
  "productName": "Lumison",
  "version": "1.0.0",
  "identifier": "com.lumison.app",
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devUrl": "http://localhost:1420",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "Lumison - Visual Art Engine",
        "width": 1280,
        "height": 800,
        "minWidth": 800,
        "minHeight": 600,
        "resizable": true,
        "fullscreen": false,
        "decorations": true,
        "transparent": false,
        "alwaysOnTop": false
      }
    ],
    "security": {
      "csp": "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https://fonts.googleapis.com https://fonts.gstatic.com https://*.googleapis.com; media-src 'self' data: blob: https:; connect-src 'self' https: wss: data: blob:"
    }
  },
  "bundle": {
    "active": true,
    "targets": ["msi", "nsis"],
    "icon": [
      "icons/icon.ico",
      "icons/icon.png"
    ],
    "windows": {
      "wix": {
        "language": "en-US"
      }
    }
  },
  "plugins": {}
}
```

Key configuration decisions:

1. **CSP Policy**: Permissive to allow external resources (Google Fonts, CDN libraries, streaming audio)
2. **Window Settings**: Comfortable default size with reasonable minimum constraints
3. **Bundle Targets**: MSI and NSIS installers for Windows
4. **Frontend Path**: Points to Vite's dist output

### Rust Backend Structure

#### src-tauri/src/main.rs

```rust
// Prevents additional console window on Windows in release builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        // Future extension point: Register Tauri commands here
        // Example:
        // .invoke_handler(tauri::generate_handler![
        //     capture_system_audio,
        //     create_exhibition_window,
        //     get_display_info,
        // ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// ============================================================================
// FUTURE EXTENSION HOOKS
// ============================================================================

// System Audio Capture (Requirement 7.3)
// Implementation approach:
// - Use Windows WASAPI (Windows Audio Session API) via windows-rs crate
// - Create a Tauri command that returns audio stream data
// - Frontend can request audio capture and receive PCM data
// - Example signature:
// #[tauri::command]
// async fn capture_system_audio() -> Result<Vec<f32>, String> { ... }

// Multi-Screen Output (Requirement 7.4)
// Implementation approach:
// - Use tauri::window::WindowBuilder to create additional windows
// - Query available displays using tauri::window::Monitor
// - Create fullscreen windows on secondary displays
// - Example signature:
// #[tauri::command]
// async fn create_output_window(display_id: u32) -> Result<(), String> { ... }

// Exhibition Mode (Requirement 7.5)
// Implementation approach:
// - Create a fullscreen window with decorations: false
// - Disable cursor using tauri::window::Window::set_cursor_visible(false)
// - Implement keyboard shortcut to exit (e.g., Esc key)
// - Example signature:
// #[tauri::command]
// async fn enter_exhibition_mode() -> Result<(), String> { ... }
```

#### src-tauri/Cargo.toml

```toml
[package]
name = "lumison"
version = "1.0.0"
edition = "2021"

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = ["devtools"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"

# Future dependencies for system-level features:
# windows = { version = "0.58", features = ["Win32_Media_Audio"] }  # For WASAPI
# cpal = "0.15"  # Cross-platform audio I/O (alternative to WASAPI)

[features]
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]
```

### Frontend Integration

#### No Code Changes Required

The frontend code requires zero modifications because:

1. **Web API Compatibility**: Tauri's WebView provides full support for:
   - Web Audio API (audio playback, analysis, spatial audio)
   - WebGL (fluid background effects)
   - Canvas API (visualizer rendering)
   - File API (drag-and-drop, file picker)
   - Fetch API (network requests)
   - LocalStorage API (settings persistence)

2. **Path Resolution**: Vite handles path differences automatically through the `base` configuration

3. **External Resources**: CDN resources (Google Fonts, jsmediatags, color-thief) load normally through the permissive CSP

#### Optional Tauri API Usage

For future enhancements, the frontend can optionally detect Tauri and use its APIs:

```typescript
// src/utils/platform.ts
export const isTauri = () => {
  return '__TAURI__' in window;
};

// Example future usage:
// if (isTauri()) {
//   const { invoke } = await import('@tauri-apps/api/core');
//   const audioData = await invoke('capture_system_audio');
// }
```

## Data Models

### Configuration Data

#### Tauri Window Configuration

```typescript
interface WindowConfig {
  title: string;           // "Lumison - Visual Art Engine"
  width: number;           // 1280
  height: number;          // 800
  minWidth: number;        // 800
  minHeight: number;       // 600
  resizable: boolean;      // true
  fullscreen: boolean;     // false
  decorations: boolean;    // true
  transparent: boolean;    // false
  alwaysOnTop: boolean;    // false
}
```

#### Build Mode Configuration

```typescript
interface BuildConfig {
  mode: 'web' | 'desktop';
  basePath: string;        // '/' for desktop, '/Lumison/' for web
  outputDir: string;       // 'dist' for web, 'src-tauri/target' for desktop
  platform: 'windows' | 'linux' | 'macos' | 'web';
}
```

### Extension Point Interfaces

These interfaces define the contracts for future system-level features:

#### System Audio Capture (Future)

```typescript
interface SystemAudioCapture {
  // Start capturing system audio output
  start(): Promise<void>;
  
  // Stop capturing
  stop(): Promise<void>;
  
  // Get current audio data (PCM samples)
  getAudioData(): Promise<Float32Array>;
  
  // Check if capture is available
  isAvailable(): Promise<boolean>;
}
```

#### Multi-Screen Output (Future)

```typescript
interface Display {
  id: number;
  name: string;
  width: number;
  height: number;
  scaleFactor: number;
  isPrimary: boolean;
}

interface MultiScreenOutput {
  // Get available displays
  getDisplays(): Promise<Display[]>;
  
  // Create output window on specific display
  createOutputWindow(displayId: number): Promise<void>;
  
  // Close output window
  closeOutputWindow(displayId: number): Promise<void>;
}
```

#### Exhibition Mode (Future)

```typescript
interface ExhibitionMode {
  // Enter exhibition mode (fullscreen, no UI, no cursor)
  enter(): Promise<void>;
  
  // Exit exhibition mode
  exit(): Promise<void>;
  
  // Check if in exhibition mode
  isActive(): Promise<boolean>;
}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

For the Tauri Desktop Integration feature, most requirements are configuration-based and are best validated through specific examples (unit tests) rather than property-based tests. However, we have identified one key property that should hold across different build modes:

### Property 1: Build Mode Base Path Configuration

For any build execution, when the TAURI_ENV_PLATFORM environment variable is set (indicating Tauri/desktop mode), the Vite base path configuration should be '/', and when TAURI_ENV_PLATFORM is not set (indicating web mode), the base path should be '/Lumison/' (or the value from VITE_BASE_PATH).

**Validates: Requirements 2.3, 2.4**

This property ensures that the build system correctly adapts its path configuration based on the target platform, which is critical for both web deployment (GitHub Pages with subpath) and desktop deployment (local file system with root path) to work correctly.

## Error Handling

### Build-Time Errors

1. **Missing Dependencies**
   - Error: Tauri CLI or Rust toolchain not installed
   - Handling: Provide clear error message with installation instructions
   - Prevention: Document prerequisites in README.md

2. **Configuration Errors**
   - Error: Invalid tauri.conf.json syntax
   - Handling: Tauri CLI validates and reports specific syntax errors
   - Prevention: Use JSON schema validation in IDE

3. **Build Failures**
   - Error: Rust compilation errors in main.rs
   - Handling: Display compiler error messages with line numbers
   - Prevention: Keep Rust code minimal and well-tested

4. **Asset Loading Errors**
   - Error: Frontend dist directory not found
   - Handling: Ensure `npm run build` runs before Tauri build
   - Prevention: Configure `beforeBuildCommand` in tauri.conf.json

### Runtime Errors

1. **Window Creation Failures**
   - Error: Unable to create application window
   - Handling: Log error and exit gracefully with error code
   - Recovery: Check system resources and display requirements

2. **WebView Initialization Errors**
   - Error: WebView runtime not available
   - Handling: Display error dialog with system requirements
   - Recovery: Ensure WebView2 runtime is installed (Windows)

3. **Resource Loading Errors**
   - Error: Frontend assets fail to load
   - Handling: WebView console logs detailed error messages
   - Recovery: Verify CSP configuration allows required resources

4. **External Resource Errors**
   - Error: CDN resources (fonts, libraries) fail to load
   - Handling: Frontend should have fallback behavior
   - Recovery: Check network connectivity and CSP configuration

### Development Mode Errors

1. **Port Conflicts**
   - Error: Development server port already in use
   - Handling: Vite automatically tries next available port
   - Prevention: Use `strictPort: true` to fail fast

2. **Hot Reload Failures**
   - Error: HMR connection lost
   - Handling: Display overlay with reconnection status
   - Recovery: Automatic reconnection when dev server restarts

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific configuration files, directory structure, and build outputs
- **Property tests**: Verify that build configuration adapts correctly across different modes

Both testing approaches are complementary and necessary. Unit tests catch concrete configuration errors, while property tests verify the general correctness of build mode behavior.

### Unit Testing

Unit tests will focus on:

1. **Configuration Validation**
   - Verify package.json contains required Tauri scripts and dependencies
   - Verify tauri.conf.json has correct window dimensions and settings
   - Verify Cargo.toml declares required Rust dependencies
   - Verify .gitignore excludes src-tauri/target

2. **File Structure Validation**
   - Verify src-tauri directory exists with correct structure
   - Verify main.rs exists and contains required elements
   - Verify icon files exist in src-tauri/icons
   - Verify existing frontend structure is preserved

3. **Build Output Validation**
   - Verify `npm run build` produces web build with /Lumison/ base path
   - Verify `npm run tauri build` produces .exe file
   - Verify desktop build output location (src-tauri/target/release)
   - Verify .exe file size is under 50MB

4. **Documentation Validation**
   - Verify README.md contains Tauri development instructions
   - Verify docs/TAURI_INTEGRATION.md exists
   - Verify documentation contains required sections (commands, permissions, extensions)

5. **Code Content Validation**
   - Verify main.rs contains extension point comments
   - Verify main.rs opens devtools in debug mode
   - Verify tauri.conf.json CSP allows required external resources

### Property-Based Testing

Property-based testing will be implemented using a suitable library for the target language (JavaScript/TypeScript for build configuration tests). Each test will run a minimum of 100 iterations.

**Property Test 1: Build Mode Base Path Configuration**

Test that the Vite configuration function returns the correct base path for different environment configurations.

```typescript
// Test tag: Feature: tauri-desktop-integration, Property 1: Build mode base path configuration
// Generate random combinations of:
// - mode: 'development' | 'production'
// - TAURI_ENV_PLATFORM: undefined | 'windows' | 'linux' | 'macos'
// - VITE_BASE_PATH: undefined | '/CustomPath/' | '/AnotherPath/'
//
// For each combination, verify:
// - If TAURI_ENV_PLATFORM is set: base === '/'
// - If TAURI_ENV_PLATFORM is not set and mode === 'production': base === (VITE_BASE_PATH || '/Lumison/')
// - If TAURI_ENV_PLATFORM is not set and mode === 'development': base === '/'
```

### Integration Testing

Integration tests will verify end-to-end workflows:

1. **Development Workflow**
   - Run `npm run tauri:dev`
   - Verify application window opens
   - Verify devtools are open
   - Verify frontend loads correctly
   - Verify hot reload works

2. **Build Workflow**
   - Run `npm run build`
   - Verify web build output
   - Run `npm run tauri:build`
   - Verify desktop build output
   - Verify .exe runs on Windows

3. **Web API Compatibility**
   - Launch desktop app
   - Test Web Audio API functionality
   - Test WebGL rendering
   - Test File API (drag and drop)
   - Test LocalStorage persistence
   - Test Fetch API (network requests)

### Manual Testing

Some aspects require manual verification:

1. **Visual Verification**
   - Window appearance and sizing
   - Icon display in taskbar
   - Fullscreen mode (F11)
   - UI rendering correctness

2. **Platform Compatibility**
   - Windows 10 compatibility
   - Windows 11 compatibility
   - Different screen resolutions
   - Different DPI settings

3. **User Experience**
   - Window resizing behavior
   - Application startup time
   - Resource loading performance
   - Error message clarity

### Test Configuration

- **Property test iterations**: Minimum 100 per test
- **Test framework**: Vitest for unit tests, fast-check for property tests
- **Coverage target**: 90% for configuration code
- **CI/CD**: Run tests on every pull request

Each property-based test must include a comment tag referencing the design document property:
```
// Feature: tauri-desktop-integration, Property {number}: {property_text}
```

## Development Workflows

### Initial Setup

1. **Install Rust Toolchain**
   ```bash
   # Windows: Download from https://rustup.rs/
   # Or use winget
   winget install Rustlang.Rustup
   ```

2. **Install Tauri CLI**
   ```bash
   npm install --save-dev @tauri-apps/cli
   npm install @tauri-apps/api
   ```

3. **Initialize Tauri**
   ```bash
   npm run tauri init
   # Follow prompts to configure
   ```

4. **Configure Build System**
   - Update vite.config.ts to detect Tauri mode
   - Update package.json scripts
   - Configure tauri.conf.json

### Development Mode

```bash
# Start Tauri development mode
npm run tauri:dev

# This will:
# 1. Start Vite dev server on port 1420
# 2. Compile Rust backend
# 3. Launch desktop application with devtools
# 4. Enable hot reload for frontend changes
```

### Building for Production

```bash
# Build web version (GitHub Pages)
npm run build
# Output: dist/ directory with /Lumison/ base path

# Build desktop version
npm run tauri:build
# Output: src-tauri/target/release/lumison.exe
```

### Debugging

1. **Frontend Debugging**
   - Use Chrome DevTools (automatically opened in dev mode)
   - Console logs appear in DevTools console
   - Network requests visible in Network tab

2. **Rust Backend Debugging**
   - Rust logs appear in terminal running `tauri:dev`
   - Use `println!` or `dbg!` macros for debugging
   - Use `RUST_LOG=debug` environment variable for verbose logging

3. **Build Issues**
   - Check Rust compiler errors in terminal
   - Verify Vite build completes successfully
   - Check tauri.conf.json syntax

### Adding Future Extensions

#### Adding a Tauri Command

1. **Define command in main.rs**
   ```rust
   #[tauri::command]
   async fn my_command(param: String) -> Result<String, String> {
       Ok(format!("Received: {}", param))
   }
   ```

2. **Register command in builder**
   ```rust
   .invoke_handler(tauri::generate_handler![my_command])
   ```

3. **Call from frontend**
   ```typescript
   import { invoke } from '@tauri-apps/api/core';
   const result = await invoke('my_command', { param: 'test' });
   ```

#### Adding System Audio Capture

1. **Add Windows dependency to Cargo.toml**
   ```toml
   windows = { version = "0.58", features = ["Win32_Media_Audio"] }
   ```

2. **Implement capture module**
   ```rust
   // src-tauri/src/audio_capture.rs
   use windows::Win32::Media::Audio::*;
   
   #[tauri::command]
   pub async fn capture_system_audio() -> Result<Vec<f32>, String> {
       // WASAPI implementation
   }
   ```

3. **Update permissions in tauri.conf.json**
   ```json
   "permissions": ["audio-capture"]
   ```

#### Adding Multi-Screen Output

1. **Use Tauri window API**
   ```rust
   use tauri::Manager;
   
   #[tauri::command]
   async fn create_output_window(
       app: tauri::AppHandle,
       display_id: u32
   ) -> Result<(), String> {
       let monitors = app.available_monitors()
           .map_err(|e| e.to_string())?;
       
       // Create window on specific monitor
   }
   ```

2. **Query displays from frontend**
   ```typescript
   import { availableMonitors } from '@tauri-apps/api/window';
   const displays = await availableMonitors();
   ```

## Build System Details

### Vite Configuration Logic

```typescript
// vite.config.ts
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isTauri = process.env.TAURI_ENV_PLATFORM !== undefined;
  const productionBase = env.VITE_BASE_PATH || '/Lumison/';
  
  return {
    base: isTauri ? '/' : (mode === 'production' ? productionBase : '/'),
    
    server: {
      port: isTauri ? 1420 : 3000,
      host: '0.0.0.0',
      strictPort: true,
    },
    
    // Ensure Tauri API is available in desktop mode
    define: {
      '__TAURI__': isTauri,
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    
    plugins: [react()],
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    
    // Optimize for desktop builds
    build: {
      target: isTauri ? 'esnext' : 'es2015',
      minify: mode === 'production',
      sourcemap: mode === 'development',
    },
  };
});
```

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "tauri:icon": "tauri icon"
  }
}
```

### Build Output Structure

```
dist/                           # Web build output
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
├── icon.svg
├── icon-static.svg
├── manifest.json
└── index.html                  # References /Lumison/ base path

src-tauri/target/release/       # Desktop build output
├── lumison.exe                 # Main executable (~15-30MB)
├── bundle/
│   ├── msi/
│   │   └── lumison_1.0.0_x64.msi
│   └── nsis/
│       └── lumison_1.0.0_x64-setup.exe
└── ...
```

## Performance Considerations

### Desktop Application Size

- **Target size**: < 50MB for .exe
- **Typical size**: 15-30MB (Tauri runtime + WebView + app code)
- **Optimization strategies**:
  - Use `strip = true` in Cargo.toml for release builds
  - Enable LTO (Link Time Optimization)
  - Minimize Rust dependencies
  - Use Vite's code splitting for frontend

### Startup Performance

- **Target startup time**: < 2 seconds on modern hardware
- **Factors**:
  - Rust binary initialization: ~100-200ms
  - WebView initialization: ~300-500ms
  - Frontend loading: ~500-1000ms
- **Optimization**:
  - Lazy load non-critical frontend modules
  - Preload critical assets
  - Use Vite's build optimization

### Runtime Performance

- **WebView overhead**: Minimal (~5-10% vs native browser)
- **Web Audio API**: Full performance, no degradation
- **WebGL**: Full performance, hardware accelerated
- **Memory usage**: Similar to browser tab (~100-200MB base + content)

## Security Considerations

### Content Security Policy

The CSP in tauri.conf.json must balance security with functionality:

```json
"csp": "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https://fonts.googleapis.com https://fonts.gstatic.com https://*.googleapis.com; media-src 'self' data: blob: https:; connect-src 'self' https: wss: data: blob:"
```

**Rationale**:
- `'unsafe-inline'`: Required for React inline styles and Tailwind
- `'unsafe-eval'`: Required for some audio processing libraries
- `https://fonts.googleapis.com`: Google Fonts
- `https://*.googleapis.com`: Gemini API
- `media-src https:`: Streaming audio from various sources
- `connect-src https: wss:`: Network requests and WebSocket connections

**Future hardening**:
- Remove `'unsafe-eval'` if possible by refactoring dependencies
- Restrict `https:` to specific domains once all sources are known
- Add nonce-based CSP for inline scripts

### File System Access

- **Current**: No direct file system access from frontend
- **Future**: If adding file system features, use Tauri's scoped file system API
- **Principle**: Least privilege - only grant necessary permissions

### Network Security

- **HTTPS enforcement**: All external resources should use HTTPS
- **API keys**: Store in environment variables, not in code
- **User data**: Keep in LocalStorage (sandboxed per application)

## Migration Path

### From Web to Desktop

Users can transition from web version to desktop version seamlessly:

1. **Settings preservation**: LocalStorage data is separate between web and desktop
2. **Manual export/import**: Future feature to export settings from web and import to desktop
3. **No breaking changes**: Both versions maintain feature parity

### Future Desktop-Only Features

When adding desktop-only features (system audio capture, etc.):

1. **Feature detection**: Frontend checks `isTauri()` before using desktop features
2. **Graceful degradation**: Web version shows appropriate UI for unavailable features
3. **Documentation**: Clearly document which features are desktop-only

## Documentation Structure

### README.md Updates

Add section:

```markdown
## Desktop Application

### Development
\`\`\`bash
npm run tauri:dev
\`\`\`

### Building
\`\`\`bash
npm run tauri:build
\`\`\`

### Prerequisites
- Rust toolchain (https://rustup.rs/)
- Node.js 18+
- Windows 10/11 (for Windows builds)

See [docs/TAURI_INTEGRATION.md](docs/TAURI_INTEGRATION.md) for detailed information.
```

### docs/TAURI_INTEGRATION.md

Create comprehensive documentation covering:

1. **Architecture Overview**
   - High-level design
   - Directory structure
   - Build system flow

2. **Development Guide**
   - Setup instructions
   - Development workflow
   - Debugging techniques

3. **Extension Guide**
   - Adding Tauri commands
   - Configuring permissions
   - System audio capture implementation
   - Multi-screen output implementation
   - Exhibition mode implementation

4. **Build and Distribution**
   - Build process
   - Installer creation
   - Distribution strategies

5. **Troubleshooting**
   - Common issues
   - Error messages
   - Solutions

## Conclusion

This design provides a minimal, non-invasive integration of Tauri into the Lumison project. The architecture maintains clear separation between web and desktop builds, requires zero frontend code changes, and provides well-documented extension points for future system-level features.

Key design decisions:

1. **Minimal Rust backend**: Only window management, no business logic
2. **Dual build system**: Separate pipelines for web and desktop
3. **Zero frontend changes**: Full Web API compatibility through WebView
4. **Clear extension points**: Documented hooks for future features
5. **Developer-friendly**: Preserves existing workflows and tools

The implementation can proceed incrementally:
1. Phase 1: Basic Tauri integration and window management
2. Phase 2: Build system configuration and testing
3. Phase 3: Documentation and developer guides
4. Phase 4: Future extensions (system audio, multi-screen, exhibition mode)
