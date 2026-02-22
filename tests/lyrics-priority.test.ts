/**
 * Lyrics Priority Test
 * 
 * Verifies that the lyrics system follows the correct priority:
 * 1. Embedded ID3/FLAC lyrics (highest)
 * 2. Online API (fallback)
 * 3. External LRC file (lowest, last resort)
 */

import { describe, it, expect } from 'vitest';
import { getLyricsPriority } from '../src/services/lyrics/id3Parser';

describe('Lyrics Priority System', () => {
  const mockLrcLyrics = [
    { time: 0, text: 'LRC Line 1' },
    { time: 5, text: 'LRC Line 2' },
  ];

  const mockEmbeddedLyrics = [
    { time: 0, text: 'Embedded Line 1' },
    { time: 5, text: 'Embedded Line 2' },
  ];

  const mockOnlineLyrics = [
    { time: 0, text: 'Online Line 1' },
    { time: 5, text: 'Online Line 2' },
  ];

  it('should prioritize embedded lyrics over LRC file', () => {
    const result = getLyricsPriority({
      lrcFile: mockLrcLyrics,
      embedded: mockEmbeddedLyrics,
    });

    expect(result.source).toBe('embedded');
    expect(result.lyrics).toEqual(mockEmbeddedLyrics);
    expect(result.lyrics[0].text).toBe('Embedded Line 1');
  });

  it('should prioritize embedded lyrics over online lyrics', () => {
    const result = getLyricsPriority({
      embedded: mockEmbeddedLyrics,
      online: mockOnlineLyrics,
    });

    expect(result.source).toBe('embedded');
    expect(result.lyrics).toEqual(mockEmbeddedLyrics);
  });

  it('should prioritize embedded lyrics when all sources are available', () => {
    const result = getLyricsPriority({
      lrcFile: mockLrcLyrics,
      embedded: mockEmbeddedLyrics,
      online: mockOnlineLyrics,
    });

    expect(result.source).toBe('embedded');
    expect(result.lyrics).toEqual(mockEmbeddedLyrics);
  });

  it('should use online lyrics when embedded lyrics are not available', () => {
    const result = getLyricsPriority({
      lrcFile: mockLrcLyrics,
      online: mockOnlineLyrics,
    });

    expect(result.source).toBe('online');
    expect(result.lyrics).toEqual(mockOnlineLyrics);
    expect(result.lyrics[0].text).toBe('Online Line 1');
  });

  it('should use online lyrics when embedded lyrics are empty', () => {
    const result = getLyricsPriority({
      embedded: [],
      online: mockOnlineLyrics,
    });

    expect(result.source).toBe('online');
    expect(result.lyrics).toEqual(mockOnlineLyrics);
  });

  it('should use LRC file only when no embedded or online lyrics are available', () => {
    const result = getLyricsPriority({
      lrcFile: mockLrcLyrics,
    });

    expect(result.source).toBe('lrc-file');
    expect(result.lyrics).toEqual(mockLrcLyrics);
  });

  it('should return empty lyrics when no sources are available', () => {
    const result = getLyricsPriority({});

    expect(result.source).toBe('none');
    expect(result.lyrics).toEqual([]);
  });

  it('should ignore empty embedded lyrics and use online lyrics', () => {
    const result = getLyricsPriority({
      lrcFile: mockLrcLyrics,
      embedded: [],
      online: mockOnlineLyrics,
    });

    expect(result.source).toBe('online');
    expect(result.lyrics).toEqual(mockOnlineLyrics);
  });

  it('should ignore empty online lyrics and use LRC file', () => {
    const result = getLyricsPriority({
      lrcFile: mockLrcLyrics,
      embedded: [],
      online: [],
    });

    expect(result.source).toBe('lrc-file');
    expect(result.lyrics).toEqual(mockLrcLyrics);
  });

  it('should never use LRC file when embedded lyrics exist', () => {
    const result = getLyricsPriority({
      lrcFile: mockLrcLyrics,
      embedded: mockEmbeddedLyrics,
    });

    expect(result.source).not.toBe('lrc-file');
    expect(result.source).toBe('embedded');
    expect(result.lyrics).toEqual(mockEmbeddedLyrics);
  });

  it('should never use LRC file when online lyrics exist (and no embedded)', () => {
    const result = getLyricsPriority({
      lrcFile: mockLrcLyrics,
      online: mockOnlineLyrics,
    });

    expect(result.source).not.toBe('lrc-file');
    expect(result.source).toBe('online');
    expect(result.lyrics).toEqual(mockOnlineLyrics);
  });
});

describe('Lyrics Priority - Edge Cases', () => {
  it('should handle undefined sources gracefully', () => {
    const result = getLyricsPriority({
      lrcFile: undefined,
      embedded: undefined,
      online: undefined,
    });

    expect(result.source).toBe('none');
    expect(result.lyrics).toEqual([]);
  });

  it('should handle null values in lyrics arrays', () => {
    const result = getLyricsPriority({
      lrcFile: null as any,
      embedded: null as any,
    });

    expect(result.source).toBe('none');
    expect(result.lyrics).toEqual([]);
  });

  it('should prioritize single-line embedded lyrics over online', () => {
    const singleLineLyrics = [{ time: 0, text: 'Only one line' }];
    
    const result = getLyricsPriority({
      embedded: singleLineLyrics,
      online: [
        { time: 0, text: 'Online Line 1' },
        { time: 5, text: 'Online Line 2' },
      ],
    });

    expect(result.source).toBe('embedded');
    expect(result.lyrics).toEqual(singleLineLyrics);
  });

  it('should use LRC file as last resort when both embedded and online are empty', () => {
    const result = getLyricsPriority({
      lrcFile: [{ time: 0, text: 'LRC fallback' }],
      embedded: [],
      online: [],
    });

    expect(result.source).toBe('lrc-file');
    expect(result.lyrics.length).toBe(1);
  });
});
