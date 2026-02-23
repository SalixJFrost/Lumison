/**
 * Tests for Internet Archive Service
 */

import {
  searchArchive,
  fetchArchiveMetadata,
  getBestAudioFile,
  parseArchiveUrl,
  POPULAR_COLLECTIONS
} from '../InternetArchiveService';

describe('InternetArchiveService', () => {
  describe('parseArchiveUrl', () => {
    it('should parse valid archive.org URLs', () => {
      const url = 'https://archive.org/details/test-identifier';
      const identifier = parseArchiveUrl(url);
      expect(identifier).toBe('test-identifier');
    });

    it('should handle URLs with query parameters', () => {
      const url = 'https://archive.org/details/test-identifier?param=value';
      const identifier = parseArchiveUrl(url);
      expect(identifier).toBe('test-identifier');
    });

    it('should return null for invalid URLs', () => {
      const url = 'https://example.com/not-archive';
      const identifier = parseArchiveUrl(url);
      expect(identifier).toBeNull();
    });

    it('should return null for malformed URLs', () => {
      const url = 'not-a-url';
      const identifier = parseArchiveUrl(url);
      expect(identifier).toBeNull();
    });
  });

  describe('getBestAudioFile', () => {
    it('should prefer VBR MP3 format', () => {
      const metadata = {
        identifier: 'test',
        title: 'Test',
        audioFiles: [
          { name: 'track.flac', format: 'FLAC', size: 1000, url: 'url1' },
          { name: 'track.mp3', format: 'VBR MP3', size: 500, url: 'url2' },
          { name: 'track.ogg', format: 'Ogg Vorbis', size: 400, url: 'url3' }
        ],
        metadata: {}
      };

      const best = getBestAudioFile(metadata);
      expect(best?.format).toBe('VBR MP3');
    });

    it('should fall back to MP3 if VBR MP3 not available', () => {
      const metadata = {
        identifier: 'test',
        title: 'Test',
        audioFiles: [
          { name: 'track.flac', format: 'FLAC', size: 1000, url: 'url1' },
          { name: 'track.mp3', format: 'MP3', size: 500, url: 'url2' }
        ],
        metadata: {}
      };

      const best = getBestAudioFile(metadata);
      expect(best?.format).toBe('MP3');
    });

    it('should return first file if no preferred format found', () => {
      const metadata = {
        identifier: 'test',
        title: 'Test',
        audioFiles: [
          { name: 'track.wav', format: 'WAV', size: 1000, url: 'url1' }
        ],
        metadata: {}
      };

      const best = getBestAudioFile(metadata);
      expect(best?.format).toBe('WAV');
    });

    it('should return null if no audio files', () => {
      const metadata = {
        identifier: 'test',
        title: 'Test',
        audioFiles: [],
        metadata: {}
      };

      const best = getBestAudioFile(metadata);
      expect(best).toBeNull();
    });
  });

  describe('POPULAR_COLLECTIONS', () => {
    it('should have valid collection definitions', () => {
      expect(POPULAR_COLLECTIONS.length).toBeGreaterThan(0);
      
      POPULAR_COLLECTIONS.forEach(collection => {
        expect(collection.id).toBeTruthy();
        expect(collection.name).toBeTruthy();
        expect(typeof collection.id).toBe('string');
        expect(typeof collection.name).toBe('string');
      });
    });

    it('should include opensource_audio collection', () => {
      const hasOpenSource = POPULAR_COLLECTIONS.some(
        c => c.id === 'opensource_audio'
      );
      expect(hasOpenSource).toBe(true);
    });
  });

  // Integration tests (require network access)
  describe('searchArchive (integration)', () => {
    it('should search and return results', async () => {
      const results = await searchArchive({
        query: 'test',
        collection: 'opensource_audio',
        limit: 5
      });

      expect(Array.isArray(results)).toBe(true);
      
      if (results.length > 0) {
        const item = results[0];
        expect(item.identifier).toBeTruthy();
        expect(item.title).toBeTruthy();
      }
    }, 10000); // 10 second timeout for network request
  });

  describe('fetchArchiveMetadata (integration)', () => {
    it('should fetch metadata for a known item', async () => {
      // Using a known public domain item
      const metadata = await fetchArchiveMetadata('Greatest_Speeches_of_the_20th_Century');

      if (metadata) {
        expect(metadata.identifier).toBe('Greatest_Speeches_of_the_20th_Century');
        expect(metadata.title).toBeTruthy();
        expect(Array.isArray(metadata.audioFiles)).toBe(true);
      }
    }, 10000);

    it('should return null for non-existent item', async () => {
      const metadata = await fetchArchiveMetadata('this-does-not-exist-12345');
      expect(metadata).toBeNull();
    }, 10000);
  });
});
