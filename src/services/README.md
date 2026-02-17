# Services Directory Structure

This directory contains all service modules organized by functionality.

## Directory Structure

```
services/
├── animation/          # Animation and physics services
│   ├── spring.ts      # Spring physics implementation
│   ├── springSystem.ts # Spring system for managing multiple springs
│   └── index.ts       # Barrel export
│
├── music/             # Music-related services
│   ├── lyricsService.ts    # Netease Cloud Music API integration
│   ├── bilibiliService.ts  # Bilibili video/audio API integration
│   ├── geminiService.ts    # Gemini AI lyrics analysis
│   └── index.ts            # Barrel export
│
├── lyrics/            # Lyrics parsing and processing
│   ├── parser.ts      # Main lyrics parser
│   ├── lrc.ts         # LRC format parser
│   ├── netease.ts     # Netease lyrics format
│   ├── translation.ts # Translation handling
│   ├── types.ts       # Type definitions
│   ├── utils.ts       # Utility functions
│   └── index.ts       # Barrel export
│
├── ui/                # UI-related services
│   ├── keyboardRegistry.ts # Keyboard shortcut management
│   └── index.ts            # Barrel export
│
├── cache.ts           # Resource caching service
├── utils.ts           # General utility functions
└── index.ts           # Main barrel export
```

## Usage

Import services using the barrel exports:

```typescript
// Import from category
import { SpringSystem } from '../services/animation';
import { fetchNeteaseSong } from '../services/music';
import { keyboardRegistry } from '../services/ui';

// Or import from main barrel
import { SpringSystem, fetchNeteaseSong, keyboardRegistry } from '../services';
```

## Service Categories

### Animation
Services for handling animations and physics simulations.

### Music
Services for fetching music data from various platforms (Netease, Bilibili) and AI analysis.

### Lyrics
Services for parsing, processing, and managing lyrics in various formats.

### UI
Services for managing user interface interactions like keyboard shortcuts.

### Core
General utilities and caching services used across the application.
