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
        `Direct fetch failed with status: ${response.status}`,
      );
    }
    const text = await response.text();
    return JSON.parse(text);
  } catch (directError) {
    // 如果是 AbortError，直接抛出
    if (directError instanceof Error && directError.name === 'AbortError') {
      throw directError;
    }

    // 2. Direct request failed (likely CORS), try single reliable proxy
    console.log("Direct fetch failed (likely CORS), trying proxy:", directError);

    try {
      // 使用最可靠的代理服务
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
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
      const text = await response.text();
      return JSON.parse(text);
    } catch (proxyError) {
      // 如果是 AbortError，直接抛出
      if (proxyError instanceof Error && proxyError.name === 'AbortError') {
        throw proxyError;
      }
      console.warn(`Proxy failed:`, proxyError);
      throw new Error("All proxy requests failed");
    }
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
    
    // 获取调色板
    const palette = colorThief.getPalette(img, 10);

    if (!palette || palette.length === 0) {
      return [];
    }

    // 计算颜色的"权重"分数，综合考虑多个因素
    const scoredColors = palette.map((rgb: number[]) => {
      const [r, g, b] = rgb;
      
      // 1. 亮度 (0-255)
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      
      // 2. 饱和度 (0-255)
      const saturation = Math.max(r, g, b) - Math.min(r, g, b);
      
      // 3. 色彩丰富度（避免灰色）
      const colorfulness = saturation / (luminance + 1);
      
      // 综合评分：
      // - 亮度适中（不要太暗或太亮）
      // - 有一定饱和度（但不过分）
      // - 避免纯灰色
      const luminanceScore = luminance > 40 && luminance < 200 ? 1 : 0.5;
      const saturationScore = saturation > 20 ? Math.min(saturation / 100, 1) : 0.3;
      const colorfulnessScore = colorfulness > 0.1 ? 1 : 0.5;
      
      const totalScore = luminanceScore * saturationScore * colorfulnessScore;
      
      return { rgb, score: totalScore, luminance, saturation };
    });

    // 按分数排序
    scoredColors.sort((a, b) => b.score - a.score);

    // 选择前3个颜色，但确保它们有一定的差异性
    const selectedColors: number[][] = [];
    
    for (const color of scoredColors) {
      if (selectedColors.length >= 3) break;
      
      // 检查与已选颜色的差异
      const isDifferent = selectedColors.every(selected => {
        const diff = Math.abs(color.rgb[0] - selected[0]) +
                     Math.abs(color.rgb[1] - selected[1]) +
                     Math.abs(color.rgb[2] - selected[2]);
        return diff > 60; // 确保颜色有足够差异
      });
      
      if (isDifferent || selectedColors.length === 0) {
        selectedColors.push(color.rgb);
      }
    }

    // 如果没有足够的颜色，用评分最高的填充
    while (selectedColors.length < 3 && scoredColors.length > 0) {
      const nextColor = scoredColors[selectedColors.length];
      if (nextColor) {
        selectedColors.push(nextColor.rgb);
      } else {
        break;
      }
    }
    
    // 转换为 RGB 字符串
    return selectedColors.map((c: number[]) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`);
  } catch (err) {
    console.warn("Color extraction failed", err);
    return [];
  }
};

/**
 * Get supported audio formats for the current browser
 */
export const getSupportedAudioFormats = (): Record<string, boolean> => {
  const audio = document.createElement('audio');
  const canPlay = (mimeType: string) => {
    const result = audio.canPlayType(mimeType);
    return result === 'probably' || result === 'maybe';
  };

  return {
    mp3: canPlay('audio/mpeg'),
    wav: canPlay('audio/wav') || canPlay('audio/wave'),
    flac: canPlay('audio/flac'),
    m4a: canPlay('audio/mp4') || canPlay('audio/x-m4a'),
    aac: canPlay('audio/aac') || canPlay('audio/aacp'),
    ogg: canPlay('audio/ogg') || canPlay('audio/ogg; codecs="vorbis"'),
    opus: canPlay('audio/ogg; codecs="opus"') || 
          canPlay('audio/webm; codecs="opus"') || 
          canPlay('audio/opus'),
    webm: canPlay('audio/webm') || canPlay('audio/webm; codecs="opus"'),
    aiff: canPlay('audio/aiff') || 
          canPlay('audio/x-aiff') || 
          canPlay('audio/aif'),
  };
};
