/**
 * ID3 Tag Lyrics Parser
 * Extracts embedded lyrics from audio files (MP3, FLAC, etc.)
 * Supports:
 * - ID3v2 USLT (Unsynchronized Lyrics)
 * - ID3v2 SYLT (Synchronized Lyrics)
 * - FLAC Vorbis Comments (LYRICS tag)
 */

import { LyricLine } from './types';
import { parseLyrics } from './index';

/**
 * Extract lyrics from audio file metadata
 * Uses jsmediatags library for ID3 parsing
 */
export const extractEmbeddedLyrics = async (
  file: File
): Promise<{ lyrics: LyricLine[]; source: 'id3' | 'flac' | 'none' }> => {
  try {
    // Dynamic import to avoid bundling if not used
    const jsmediatags = await import('jsmediatags');

    return new Promise((resolve) => {
      jsmediatags.read(file, {
        onSuccess: (tag: any) => {
          const tags = tag.tags;

          // Try USLT (Unsynchronized Lyrics) - most common
          if (tags.USLT) {
            const usltData = Array.isArray(tags.USLT) ? tags.USLT[0] : tags.USLT;
            const lyricsText = usltData.lyrics || usltData.text || usltData;

            if (typeof lyricsText === 'string' && lyricsText.trim()) {
              console.log('✓ Found ID3 USLT lyrics');
              const parsed = parseLyrics(lyricsText);
              resolve({ lyrics: parsed, source: 'id3' });
              return;
            }
          }

          // Try SYLT (Synchronized Lyrics)
          if (tags.SYLT) {
            const syltData = Array.isArray(tags.SYLT) ? tags.SYLT[0] : tags.SYLT;
            const lyrics = parseSYLT(syltData);

            if (lyrics.length > 0) {
              console.log('✓ Found ID3 SYLT synchronized lyrics');
              resolve({ lyrics, source: 'id3' });
              return;
            }
          }

          // Try generic LYRICS tag (some taggers use this)
          if (tags.LYRICS) {
            const lyricsText = tags.LYRICS;
            if (typeof lyricsText === 'string' && lyricsText.trim()) {
              console.log('✓ Found ID3 LYRICS tag');
              const parsed = parseLyrics(lyricsText);
              resolve({ lyrics: parsed, source: 'id3' });
              return;
            }
          }

          // Try Vorbis Comments (FLAC)
          if (tags.comment && typeof tags.comment === 'object') {
            const comment = tags.comment as any;
            
            // Check for LYRICS field
            if (comment.LYRICS) {
              const lyricsText = Array.isArray(comment.LYRICS)
                ? comment.LYRICS[0]
                : comment.LYRICS;

              if (typeof lyricsText === 'string' && lyricsText.trim()) {
                console.log('✓ Found FLAC LYRICS comment');
                const parsed = parseLyrics(lyricsText);
                resolve({ lyrics: parsed, source: 'flac' });
                return;
              }
            }

            // Check for UNSYNCEDLYRICS field (alternative)
            if (comment.UNSYNCEDLYRICS) {
              const lyricsText = Array.isArray(comment.UNSYNCEDLYRICS)
                ? comment.UNSYNCEDLYRICS[0]
                : comment.UNSYNCEDLYRICS;

              if (typeof lyricsText === 'string' && lyricsText.trim()) {
                console.log('✓ Found FLAC UNSYNCEDLYRICS comment');
                const parsed = parseLyrics(lyricsText);
                resolve({ lyrics: parsed, source: 'flac' });
                return;
              }
            }
          }

          // No lyrics found
          resolve({ lyrics: [], source: 'none' });
        },
        onError: (error: any) => {
          console.warn('ID3 tag reading failed:', error);
          resolve({ lyrics: [], source: 'none' });
        },
      });
    });
  } catch (error) {
    console.warn('jsmediatags not available:', error);
    return { lyrics: [], source: 'none' };
  }
};

/**
 * Parse SYLT (Synchronized Lyrics) format
 * SYLT contains time-stamped lyrics
 */
const parseSYLT = (syltData: any): LyricLine[] => {
  try {
    if (!syltData || !syltData.lyrics) {
      return [];
    }

    const lyrics: LyricLine[] = [];
    const syltLyrics = Array.isArray(syltData.lyrics)
      ? syltData.lyrics
      : [syltData.lyrics];

    for (const item of syltLyrics) {
      if (item.text && typeof item.timestamp === 'number') {
        // SYLT timestamps are in milliseconds
        const timeInSeconds = item.timestamp / 1000;
        lyrics.push({
          time: timeInSeconds,
          text: item.text.trim(),
          isPreciseTiming: true,
        });
      }
    }

    // Sort by time
    lyrics.sort((a, b) => a.time - b.time);

    return lyrics;
  } catch (error) {
    console.warn('Failed to parse SYLT data:', error);
    return [];
  }
};

/**
 * Find matching LRC file in the same directory
 * Matches by filename similarity
 */
export const findMatchingLRCFile = (
  audioFile: File,
  lrcFiles: File[]
): File | null => {
  if (lrcFiles.length === 0) return null;

  const audioBasename = audioFile.name.replace(/\.[^/.]+$/, '').toLowerCase();

  // Try exact match first
  const exactMatch = lrcFiles.find((lrc) => {
    const lrcBasename = lrc.name.replace(/\.[^/.]+$/, '').toLowerCase();
    return lrcBasename === audioBasename;
  });

  if (exactMatch) return exactMatch;

  // Try fuzzy match
  let bestMatch: { file: File; score: number } | null = null;
  const minSimilarity = 0.7;

  for (const lrcFile of lrcFiles) {
    const lrcBasename = lrcFile.name.replace(/\.[^/.]+$/, '').toLowerCase();
    const similarity = calculateSimilarity(audioBasename, lrcBasename);

    if (similarity >= minSimilarity) {
      if (!bestMatch || similarity > bestMatch.score) {
        bestMatch = { file: lrcFile, score: similarity };
      }
    }
  }

  return bestMatch?.file || null;
};

/**
 * Calculate string similarity (Levenshtein distance)
 */
const calculateSimilarity = (str1: string, str2: string): number => {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return maxLen === 0 ? 1 : 1 - distance / maxLen;
};

/**
 * Load LRC file content
 */
export const loadLRCFile = async (file: File): Promise<LyricLine[]> => {
  try {
    const text = await file.text();
    return parseLyrics(text);
  } catch (error) {
    console.warn('Failed to load LRC file:', error);
    return [];
  }
};

/**
 * Priority order for lyrics sources:
 * 1. Embedded ID3/FLAC lyrics (highest priority - most reliable)
 * 2. Online API (fallback when no embedded lyrics)
 * 3. External LRC file (lowest priority)
 */
export const getLyricsPriority = (sources: {
  lrcFile?: LyricLine[];
  embedded?: LyricLine[];
  online?: LyricLine[];
}): { lyrics: LyricLine[]; source: string } => {
  // 1. 最高优先级：内嵌歌词
  if (sources.embedded && sources.embedded.length > 0) {
    return { lyrics: sources.embedded, source: 'embedded' };
  }

  // 2. 次优先级：在线API
  if (sources.online && sources.online.length > 0) {
    return { lyrics: sources.online, source: 'online' };
  }

  // 3. 最低优先级：外部LRC文件
  if (sources.lrcFile && sources.lrcFile.length > 0) {
    return { lyrics: sources.lrcFile, source: 'lrc-file' };
  }

  return { lyrics: [], source: 'none' };
};
