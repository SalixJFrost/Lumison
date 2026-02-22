# Implementation Plan: Tauri Desktop Integration

## Overview

This implementation plan converts the Lumison web application into a dual-mode project that supports both GitHub Pages deployment and native desktop application builds. The approach maintains zero frontend code changes while adding Tauri infrastructure for desktop packaging. Implementation follows an incremental strategy: environment setup, Tauri initialization, configuration, build system enhancement, testing, and documentation.

## Tasks

- [x] 1. Set up development environment and prerequisites
  - Install Rust toolchain (rustup) if not present
  - Install Tauri CLI as dev dependency: `npm install --save-dev @tauri-apps/cli`
  - Install Tauri API as runtime dependency: `npm install @tauri-apps/api`
  - Verify installations with `rustc --version` and `npm run tauri --version`
  - _Requirements: 8.1, 8.2_

- [x] 2. Initialize Tauri project structure
  - [x] 2.1 Run Tauri initialization
    - Execute `npm run tauri init` to create src-tauri directory
    - Configure prompts: app name "Lumison", window title "Lumison - Visual Art Engine", dev URL "http://localhost:1420", frontend dist "../dist"
    - Verify src-tauri directory structure created with src/main.rs, Cargo.toml, tauri.conf.json
    - _Requirements: 1.1, 1.2_
  
  - [x] 2.2 Create application icons
    - Create base icon.png (1024x1024) in src-tauri/icons/
    - Run `npm run tauri icon` to generate all required icon sizes
    - Verify icon.ico and other platform-specific icons generated
    - _Requirements: 3.5, 9.6_

- [x] 3. Implement Rust backend (minimal main.rs)
  - [x] 3.1 Write main.rs with window management
    - Replace generated main.rs with minimal implementation
    - Add `#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]` to prevent console window
    - Implement setup handler to open devtools in debug mode
    - Add empty invoke_handler with comment placeholder for future commands
    - _Requirements: 1.3, 6.1_
  
  - [x] 3.2 Add extension point documentation comments
    - Add detailed comment block for System Audio Capture extension (WASAPI approach)
    - Add detailed comment block for Multi-Screen Output extension (WindowBuilder approach)
    - Add detailed comment block for Exhibition Mode extension (fullscreen + cursor hiding)
    - Include example function signatures for each extension point
    - _Requirements: 7.1, 7.3, 7.4, 7.5_
  
  - [x] 3.3 Configure Cargo.toml dependencies
    - Set package name to "lumison", version "1.0.0", edition "2021"
    - Add tauri dependency with version "2" and "devtools" feature
    - Add serde and serde_json dependencies
    - Add commented-out future dependencies (windows, cpal) with explanatory notes
    - _Requirements: 8.3, 8.4_

- [x] 4. Configure Tauri application settings
  - [x] 4.1 Write tauri.conf.json configuration
    - Set productName "Lumison", version "1.0.0", identifier "com.lumison.app"
    - Configure build commands: beforeDevCommand "npm run dev", beforeBuildCommand "npm run build"
    - Set devUrl "http://localhost:1420", frontendDist "../dist"
    - _Requirements: 1.6, 2.2_
  
  - [x] 4.2 Configure window properties
    - Set window title "Lumison - Visual Art Engine"
    - Set default dimensions: width 1280, height 800
    - Set minimum dimensions: minWidth 800, minHeight 600
    - Enable resizable, disable fullscreen by default, enable decorations
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6_
  
  - [x] 4.3 Configure Content Security Policy
    - Set CSP to allow self, unsafe-inline, unsafe-eval, data, blob
    - Allow fonts from fonts.googleapis.com and fonts.gstatic.com
    - Allow media from self, data, blob, and https sources
    - Allow connections to self, https, wss, data, blob
    - _Requirements: 4.5, 5.5_
  
  - [x] 4.4 Configure bundle settings
    - Set bundle active true, targets ["msi", "nsis"]
    - Configure icon paths pointing to src-tauri/icons/
    - Set Windows installer language to "en-US"
    - _Requirements: 9.1, 9.2, 9.6_

- [x] 5. Enhance build system configuration
  - [x] 5.1 Update vite.config.ts for dual-mode builds
    - Add Tauri detection: `const isTauri = process.env.TAURI_ENV_PLATFORM !== undefined`
    - Implement conditional base path: '/' for Tauri, '/Lumison/' (or VITE_BASE_PATH) for web production
    - Configure server port: 1420 for Tauri, 3000 for web
    - Add __TAURI__ define for runtime detection
    - _Requirements: 2.1, 2.3, 2.4_
  
  - [x]* 5.2 Write property test for build mode base path configuration
    - **Property 1: Build Mode Base Path Configuration**
    - **Validates: Requirements 2.3, 2.4**
    - Generate random combinations of mode (development/production), TAURI_ENV_PLATFORM (undefined/windows/linux/macos), VITE_BASE_PATH (undefined/custom paths)
    - Verify base path is '/' when TAURI_ENV_PLATFORM is set
    - Verify base path is VITE_BASE_PATH or '/Lumison/' in production web mode
    - Verify base path is '/' in development web mode
    - Run minimum 100 iterations
  
  - [x] 5.3 Add Tauri scripts to package.json
    - Add "tauri" script: "tauri"
    - Add "tauri:dev" script: "tauri dev"
    - Add "tauri:build" script: "tauri build"
    - Add "tauri:icon" script: "tauri icon"
    - _Requirements: 1.4, 1.5_

- [x] 6. Update dependency management and version control
  - [x] 6.1 Update .gitignore for Tauri
    - Add src-tauri/target/ to exclude Rust build artifacts
    - Add src-tauri/Cargo.lock if not already present
    - Verify existing frontend exclusions remain unchanged
    - _Requirements: 8.5_
  
  - [x]* 6.2 Write unit tests for dependency configuration
    - Verify package.json contains @tauri-apps/cli in devDependencies
    - Verify package.json contains @tauri-apps/api in dependencies
    - Verify Cargo.toml contains tauri and serde dependencies
    - Verify all Tauri scripts present in package.json
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 7. Checkpoint - Verify basic Tauri setup
  - Run `npm run tauri:dev` to test development mode
  - Verify application window opens with correct dimensions
  - Verify devtools open automatically in debug mode
  - Verify frontend loads correctly in Tauri WebView
  - Ensure all tests pass, ask the user if questions arise

- [x] 8. Implement configuration validation tests
  - [x]* 8.1 Write unit tests for tauri.conf.json structure
    - Verify window dimensions (1280x800, min 800x600)
    - Verify window title "Lumison - Visual Art Engine"
    - Verify build commands and paths
    - Verify CSP includes required domains
    - Verify bundle targets include msi and nsis
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.5_
  
  - [x]* 8.2 Write unit tests for file structure
    - Verify src-tauri directory exists
    - Verify src-tauri/src/main.rs exists
    - Verify src-tauri/Cargo.toml exists
    - Verify src-tauri/tauri.conf.json exists
    - Verify src-tauri/icons/ directory contains icon files
    - Verify existing frontend structure (src/, public/, index.html) unchanged
    - _Requirements: 1.1, 1.2_
  
  - [x]* 8.3 Write unit tests for main.rs content
    - Verify main.rs contains windows_subsystem attribute
    - Verify main.rs contains devtools setup in debug mode
    - Verify main.rs contains extension point comments (system audio, multi-screen, exhibition)
    - Verify main.rs contains invoke_handler placeholder
    - _Requirements: 1.3, 6.1, 7.1, 7.3, 7.4, 7.5_

- [x] 9. Implement build verification tests
  - [ ]* 9.1 Write unit tests for web build output
    - Run `npm run build` and verify dist/ directory created
    - Verify index.html references /Lumison/ base path
    - Verify assets directory contains bundled JS and CSS
    - Verify no Tauri-specific code in web build
    - _Requirements: 2.1, 2.5_
  
  - [ ]* 9.2 Write unit tests for desktop build output
    - Run `npm run tauri build` and verify src-tauri/target/release/ contains .exe
    - Verify .exe file size is under 50MB
    - Verify bundle directory contains MSI and NSIS installers
    - Verify desktop build uses base path '/'
    - _Requirements: 2.2, 2.6, 9.1, 9.2, 9.4_

- [x] 10. Create documentation
  - [x] 10.1 Update README.md with desktop application section
    - Add "Desktop Application" section with development and build commands
    - Document prerequisites (Rust toolchain, Node.js 18+, Windows 10/11)
    - Add link to detailed TAURI_INTEGRATION.md documentation
    - _Requirements: 10.1_
  
  - [x] 10.2 Create docs/TAURI_INTEGRATION.md
    - Write Architecture Overview section (high-level design, directory structure, build flow)
    - Write Development Guide section (setup, workflow, debugging)
    - Write Extension Guide section (adding commands, permissions, system audio, multi-screen, exhibition mode)
    - Write Build and Distribution section (build process, installers, distribution)
    - Write Troubleshooting section (common issues, error messages, solutions)
    - _Requirements: 10.2, 10.3, 10.4, 10.5_

- [x] 11. Final checkpoint and verification
  - Run full test suite to verify all unit and property tests pass
  - Build web version and verify GitHub Pages compatibility
  - Build desktop version and verify .exe runs on Windows
  - Verify hot reload works in development mode
  - Verify all documentation is complete and accurate
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties across build modes
- Unit tests validate specific configuration files and build outputs
- The Rust backend remains minimal - only window management, no business logic
- Frontend code requires zero modifications - full Web API compatibility maintained
- Build system supports both web (GitHub Pages) and desktop (native app) outputs simultaneously
