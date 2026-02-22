import { LyricLine } from "../types";
import { parseLyrics } from "./lyrics";
import { loadImageElementWithCache } from "./cache";

// Declare global for the script loaded in index.html
declare const jsmediatags: any;
declare const ColorThief: any;

export const formatTime = (seconds: number): string => {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const shuffleArray = <T>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

// Helper to request via CORS proxy (api.allorigins.win is reliable for GET requests)
// Try direct request first, fallback to proxy if CORS fails
export const fetchViaProxy = async (
  targetUrl: string,
  options?: { signal?: AbortSignal }
): Promise<any> => {
  let text: string;

  // 1. Try direct request first
  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      mode: 'cors',
      signal: options?.signal,
    });
    if (!response.ok) {
      throw new Error(
        `Direct fetch failed with status: ${response.status} ${targetUrl}`,
      );
    }
    text = await response.text();
    return JSON.parse(text);
  } catch (directError) {
    // 如果是 AbortError，直接抛出
    if (directError instanceof Error && directError.name === 'AbortError') {
      throw directError;
    }

    // 2. Direct request failed (likely CORS), try proxy
    console.log(
      "Direct fetch failed (likely CORS), trying proxy:",
      directError,
    );

    // Try multiple proxy services
    const proxies = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
      `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
    ];

    for (const proxyUrl of proxies) {
      try {
        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: options?.signal,
        });
        if (!response.ok) {
          throw new Error(`Proxy fetch failed with status: ${response.status}`);
        }
        text = await response.text();
        return JSON.parse(text);
      } catch (proxyError) {
        // 如果是 AbortError，直接抛出
        if (proxyError instanceof Error && proxyError.name === 'AbortError') {
          throw proxyError;
        }
        console.warn(`Proxy ${proxyUrl} failed:`, proxyError);
        continue;
      }
    }

    console.log(
      "All proxy requests failed for:",
      targetUrl,
    );
    throw new Error("All proxy requests failed");
  }
};

export const parseNeteaseLink = (
  input: string,
): { type: "song" | "playlist"; id: string } | null => {
  try {
    const url = new URL(input);
    const params = new URLSearchParams(url.search);
    // Handle music.163.com/#/song?id=... (Hash router)
    if (url.hash.includes("/song") || url.hash.includes("/playlist")) {
      const hashParts = url.hash.split("?");
      if (hashParts.length > 1) {
        const hashParams = new URLSearchParams(hashParts[1]);
        const id = hashParams.get("id");
        if (id) {
          if (url.hash.includes("/song")) return { type: "song", id };
          if (url.hash.includes("/playlist")) return { type: "playlist", id };
        }
      }
    }
    // Handle standard params
    const id = params.get("id");
    if (id) {
      if (url.pathname.includes("song")) return { type: "song", id };
      if (url.pathname.includes("playlist")) return { type: "playlist", id };
    }
    return null;
  } catch (e) {
    return null;
  }
};

/**
 * @deprecated Use parseLyrics from services/lyrics instead
 */
export const parseLrc = (
  lrcContent: string,
  translationContent?: string,
): LyricLine[] => {
  return parseLyrics(lrcContent, translationContent);
};

/**
 * @deprecated Use parseLyrics from services/lyrics instead
 */
export const mergeLyrics = (original: string, translation: string): string => {
  return original + "\n" + translation;
};

// Metadata Parser using jsmediatags
export const parseAudioMetadata = (
  file: File,
): Promise<{
  title?: string;
  artist?: string;
  picture?: string;
  lyrics?: string;
}> => {
  return new Promise((resolve) => {
    if (typeof jsmediatags === "undefined") {
      console.warn("jsmediatags not loaded");
      resolve({});
      return;
    }

    try {
      jsmediatags.read(file, {
        onSuccess: (tag: any) => {
          try {
            const tags = tag.tags;
            let pictureUrl = undefined;
            let lyricsText = undefined;

            if (tags.picture) {
              const { data, format } = tags.picture;
              let base64String = "";
              const len = data.length;
              for (let i = 0; i < len; i++) {
                base64String += String.fromCharCode(data[i]);
              }
              pictureUrl = `data:${format};base64,${window.btoa(base64String)}`;
            }

            // Extract embedded lyrics (USLT tag for unsynchronized lyrics)
            // Some formats also use "lyrics" or "LYRICS" tag
            if (tags.USLT) {
              // USLT can be an object with lyrics.text or just a string
              lyricsText =
                typeof tags.USLT === "object"
                  ? tags.USLT.lyrics || tags.USLT.text
                  : tags.USLT;
            } else if (tags.lyrics) {
              lyricsText = tags.lyrics;
            } else if (tags.LYRICS) {
              lyricsText = tags.LYRICS;
            }

            resolve({
              title: tags.title,
              artist: tags.artist,
              picture: pictureUrl,
              lyrics: lyricsText,
            });
          } catch (innerErr) {
            console.error("Error parsing tags structure:", innerErr);
            resolve({});
          }
        },
        onError: (error: any) => {
          console.warn("Error reading tags:", error);
          resolve({});
        },
      });
    } catch (err) {
      console.error("jsmediatags crashed:", err);
      resolve({});
    }
  });
};

export const extractColors = async (imageSrc: string): Promise<string[]> => {
  if (typeof ColorThief === "undefined") {
    console.warn("ColorThief not loaded");
    return ["#4f46e5", "#db2777", "#1f2937"];
  }

  try {
    const img = await loadImageElementWithCache(imageSrc);
    const colorThief = new ColorThief();
    const palette = colorThief.getPalette(img, 5);

    if (!palette || palette.length === 0) {
      return [];
    }

    const vibrantCandidates = palette.filter((rgb: number[]) => {
      const lum = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
      return lum > 30;
    });

    const candidates =
      vibrantCandidates.length > 0 ? vibrantCandidates : palette;

    candidates.sort((a: number[], b: number[]) => {
      const satA = Math.max(...a) - Math.min(...a);
      const satB = Math.max(...b) - Math.min(...b);
      return satB - satA;
    });

    const topColors = candidates.slice(0, 4);
    return topColors.map((c: number[]) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`);
  } catch (err) {
    console.warn("Color extraction failed", err);
    return [];
  }
};

/**
 * Check if browser supports a specific audio format
 */
export const canPlayAudioFormat = (mimeType: string): boolean => {
  const audio = document.createElement('audio');
  const canPlay = audio.canPlayType(mimeType);
  return canPlay === 'probably' || canPlay === 'maybe';
};

/**
 * Get supported audio formats for the current browser
 */
export const getSupportedAudioFormats = (): Record<string, boolean> => {
  return {
    mp3: canPlayAudioFormat('audio/mpeg'),
    wav: canPlayAudioFormat('audio/wav') || canPlayAudioFormat('audio/wave'),
    flac: canPlayAudioFormat('audio/flac'),
    m4a: canPlayAudioFormat('audio/mp4') || canPlayAudioFormat('audio/x-m4a'),
    aac: canPlayAudioFormat('audio/aac') || canPlayAudioFormat('audio/aacp'),
    ogg: canPlayAudioFormat('audio/ogg') || canPlayAudioFormat('audio/ogg; codecs="vorbis"'),
    opus: canPlayAudioFormat('audio/ogg; codecs="opus"') || 
          canPlayAudioFormat('audio/webm; codecs="opus"') || 
          canPlayAudioFormat('audio/opus'),
    webm: canPlayAudioFormat('audio/webm') || canPlayAudioFormat('audio/webm; codecs="opus"'),
    aiff: canPlayAudioFormat('audio/aiff') || 
          canPlayAudioFormat('audio/x-aiff') || 
          canPlayAudioFormat('audio/aif'),
  };
};

/**
 * Log supported audio formats to console
 */
export const logSupportedFormats = (): void => {
  const formats = getSupportedAudioFormats();
  console.log('🎵 Supported Audio Formats:');
  Object.entries(formats).forEach(([format, supported]) => {
    console.log(`   ${supported ? '✅' : '❌'} ${format.toUpperCase()}`);
  });
  
  // Add helpful note about unsupported formats
  const unsupported = Object.entries(formats)
    .filter(([_, supported]) => !supported)
    .map(([format]) => format.toUpperCase());
  
  if (unsupported.length > 0) {
    console.log('\n💡 Note: Unsupported formats depend on your browser and OS.');
    console.log('   • OPUS: Try using .ogg or .webm containers');
    console.log('   • AIFF: Limited browser support (mainly Safari)');
    console.log('   • Consider converting to MP3, FLAC, or M4A for best compatibility');
  }
};

/**
 * Get file extension from filename or URL
 */
export const getFileExtension = (filename: string): string | null => {
  const match = filename.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : null;
};

/**
 * Check if a file format is likely supported based on extension
 */
export const isFormatLikelySupported = (filename: string): boolean => {
  const ext = getFileExtension(filename);
  if (!ext) return false;
  
  const formats = getSupportedAudioFormats();
  return formats[ext as keyof typeof formats] || false;
};
