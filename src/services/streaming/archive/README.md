# Internet Archive Streaming Module

Legal, DRM-free audio streaming from archive.org.

## Quick Start

```typescript
import { InternetArchivePlayer } from './InternetArchivePlayer';
import { searchArchive, fetchArchiveMetadata } from './InternetArchiveService';

// Search for audio
const items = await searchArchive({
  query: 'jazz piano',
  collection: 'opensource_audio',
  limit: 10
});

// Get metadata
const metadata = await fetchArchiveMetadata(items[0].identifier);

// Create player
const player = new InternetArchivePlayer();
await player.initialize({});

// Play track
await player.play({
  id: metadata.identifier,
  platform: StreamingPlatform.INTERNET_ARCHIVE,
  title: metadata.title,
  artist: metadata.creator || 'Unknown',
  coverUrl: metadata.coverImage,
  duration: 0,
  url: metadata.audioFiles[0].url
});
```

## Files

- **InternetArchivePlayer.ts** - Player implementation
- **InternetArchiveService.ts** - API utilities
- **index.ts** - Module exports
- **__tests__/** - Test files

## Features

✅ Search across Internet Archive collections
✅ Fetch detailed metadata
✅ Multiple audio format support
✅ Direct HTTP streaming
✅ No authentication required
✅ Event-driven playback

## Documentation

See `/docs` for complete documentation:
- `INTERNET_ARCHIVE_QUICKSTART.md` - Get started in 5 minutes
- `INTERNET_ARCHIVE_INTEGRATION.md` - Full integration guide
- `ARCHITECTURE_INTERNET_ARCHIVE.md` - Architecture details

## License

This code is part of your music player project. Internet Archive content has various licenses (Public Domain, Creative Commons, etc.) - always check individual items.
