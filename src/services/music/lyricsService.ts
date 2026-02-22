import { fetchViaProxy } from "../utils";
import { searchAndFetchLyrics as multiPlatformSearch } from "./multiPlatformLyrics";

const LYRIC_API_BASE = "https://163api.qijieya.cn";
const METING_API = "https://api.qijieya.cn/meting/";
const NETEASE_SEARCH_API = "https://163api.qijieya.cn/cloudsearch";
const NETEASE_API_BASE = "http://music.163.com/api";
const NETEASECLOUD_API_BASE = "https://163api.qijieya.cn";

// Backup API endpoints
const BACKUP_APIS = [
  "https://163api.qijieya.cn",
  "https://netease-cloud-music-api-psi-ten.vercel.app",
  "https://music-api.heheda.top",
];

// Fetch with fallback to backup APIs
const fetchWithFallback = async (endpoint: string): Promise<any> => {
  const apis = [NETEASECLOUD_API_BASE, ...BACKUP_APIS.filter(api => api !== NETEASECLOUD_API_BASE)];
  
  for (const baseUrl of apis) {
    try {
      const url = endpoint.replace(NETEASECLOUD_API_BASE, baseUrl);
      console.log(`Trying API: ${url}`);
      const result = await fetchViaProxy(url);
      return result;
    } catch (error) {
      console.warn(`API ${baseUrl} failed:`, error);
      continue;
    }
  }
  
  throw new Error("All API endpoints failed");
};

const METADATA_KEYWORDS = [
  "歌词贡献者",
  "翻译贡献者",
  "作词",
  "作曲",
  "编曲",
  "制作",
  "词曲",
  "词 / 曲",
  "lyricist",
  "composer",
  "arrange",
  "translation",
  "translator",
  "producer",
];

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const metadataKeywordRegex = new RegExp(
  `^(${METADATA_KEYWORDS.map(escapeRegex).join("|")})\\s*[:：]`,
  "iu",
);

const TIMESTAMP_REGEX = /^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)$/;

interface NeteaseApiArtist {
  name?: string;
}

interface NeteaseApiAlbum {
  name?: string;
  picUrl?: string;
}

interface NeteaseApiSong {
  id: number;
  name?: string;
  ar?: NeteaseApiArtist[];
  al?: NeteaseApiAlbum;
  dt?: number;
}

interface NeteaseSearchResponse {
  result?: {
    songs?: NeteaseApiSong[];
  };
}

interface NeteasePlaylistResponse {
  songs?: NeteaseApiSong[];
}

interface NeteaseSongDetailResponse {
  code?: number;
  songs?: NeteaseApiSong[];
}

export interface NeteaseTrackInfo {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl?: string;
  duration?: number;
  isNetease: true;
  neteaseId: string;
}

type SearchOptions = {
  limit?: number;
  offset?: number;
};

const formatArtists = (artists?: NeteaseApiArtist[]) =>
  (artists ?? [])
    .map((artist) => artist.name?.trim())
    .filter(Boolean)
    .join("/") || "";

const mapNeteaseSongToTrack = (song: NeteaseApiSong): NeteaseTrackInfo => ({
  id: song.id.toString(),
  title: song.name?.trim() ?? "",
  artist: formatArtists(song.ar),
  album: song.al?.name?.trim() ?? "",
  coverUrl: song.al?.picUrl?.replaceAll("http:", "https:"),
  duration: song.dt,
  isNetease: true,
  neteaseId: song.id.toString(),
});

const isMetadataTimestampLine = (line: string): boolean => {
  const trimmed = line.trim();
  const match = trimmed.match(TIMESTAMP_REGEX);
  if (!match) return false;
  const content = match[4].trim();
  return metadataKeywordRegex.test(content);
};

const parseTimestampMetadata = (line: string) => {
  const match = line.trim().match(TIMESTAMP_REGEX);
  return match ? match[4].trim() : line.trim();
};

const isMetadataJsonLine = (line: string): boolean => {
  const trimmed = line.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return false;
  try {
    const json = JSON.parse(trimmed);
    if (json.c && Array.isArray(json.c)) {
      const content = json.c.map((item: any) => item.tx || "").join("");
      return metadataKeywordRegex.test(content);
    }
  } catch {
    // ignore invalid json
  }
  return false;
};

const parseJsonMetadata = (line: string) => {
  try {
    const json = JSON.parse(line.trim());
    if (json.c && Array.isArray(json.c)) {
      return json.c
        .map((item: any) => item.tx || "")
        .join("")
        .trim();
    }
  } catch {
    // ignore
  }
  return line.trim();
};

// 专门的歌词API列表（按可靠性排序）
const DEDICATED_LYRICS_APIS = [
  {
    name: "LrcLib",
    search: async (title: string, artist: string) => {
      const url = `https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`;
      const response = await fetchViaProxy(url);
      if (Array.isArray(response) && response.length > 0) {
        const result = response[0];
        return {
          lrc: result.syncedLyrics || result.plainLyrics,
          source: "LrcLib",
        };
      }
      return null;
    },
  },
  {
    name: "Lyrics.ovh",
    search: async (title: string, artist: string) => {
      const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
      const response = await fetchViaProxy(url);
      if (response && response.lyrics) {
        // Convert plain text to LRC format with simple timestamps
        const lines = response.lyrics.split('\n').filter((line: string) => line.trim());
        const lrc = lines.map((line: string, index: number) => {
          const time = index * 3; // 3 seconds per line as placeholder
          const minutes = Math.floor(time / 60);
          const seconds = time % 60;
          return `[${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.00]${line}`;
        }).join('\n');
        return {
          lrc,
          source: "Lyrics.ovh",
        };
      }
      return null;
    },
  },
  {
    name: "LRCAPI",
    search: async (title: string, artist: string) => {
      const url = `https://lrc.xms.mx/search?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`;
      const response = await fetchViaProxy(url);
      if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
        const result = response.data[0];
        if (result.lrc) {
          return {
            lrc: result.lrc,
            source: "LRCAPI",
          };
        }
      }
      return null;
    },
  },
  {
    name: "Syair.info",
    search: async (title: string, artist: string) => {
      try {
        const url = `https://api.syair.info/lyrics/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
        const response = await fetchViaProxy(url);
        if (response && response.lyrics) {
          // Convert to LRC format
          const lines = response.lyrics.split('\n').filter((line: string) => line.trim());
          const lrc = lines.map((line: string, index: number) => {
            const time = index * 3;
            const minutes = Math.floor(time / 60);
            const seconds = time % 60;
            return `[${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.00]${line}`;
          }).join('\n');
          return {
            lrc,
            source: "Syair.info",
          };
        }
      } catch (error) {
        // Silently fail
      }
      return null;
    },
  },
  {
    name: "Genius (via API)",
    search: async (title: string, artist: string) => {
      try {
        // Note: This is a simplified version, real Genius API requires authentication
        const searchQuery = `${artist} ${title}`;
        const url = `https://genius.com/api/search/multi?q=${encodeURIComponent(searchQuery)}`;
        const response = await fetchViaProxy(url);
        if (response && response.response && response.response.sections) {
          const songs = response.response.sections.find((s: any) => s.type === 'song');
          if (songs && songs.hits && songs.hits.length > 0) {
            // Note: Genius doesn't provide LRC format directly
            // This is a placeholder - would need additional processing
            return null;
          }
        }
      } catch (error) {
        // Silently fail
      }
      return null;
    },
  },
];

// 搜索专门的歌词API
const searchDedicatedLyricsAPIs = async (
  title: string,
  artist: string,
): Promise<{ lrc: string; metadata: string[]; source: string } | null> => {
  // 并发请求所有API
  const promises = DEDICATED_LYRICS_APIS.map(async (api) => {
    try {
      console.log(`Trying ${api.name}...`);
      const result = await api.search(title, artist);
      if (result && result.lrc) {
        return {
          lrc: result.lrc,
          metadata: [],
          source: result.source,
        };
      }
    } catch (error) {
      console.warn(`${api.name} failed:`, error);
    }
    return null;
  });

  const results = await Promise.allSettled(promises);
  
  // 返回第一个成功的结果
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      return result.value;
    }
  }

  return null;
};

const extractMetadataLines = (content: string) => {
  const metadataSet = new Set<string>();
  const bodyLines: string[] = [];

  content.split("\n").forEach((line) => {
    if (!line.trim()) return;
    if (isMetadataTimestampLine(line)) {
      metadataSet.add(parseTimestampMetadata(line));
    } else if (isMetadataJsonLine(line)) {
      metadataSet.add(parseJsonMetadata(line));
    } else {
      bodyLines.push(line);
    }
  });

  return {
    clean: bodyLines.join("\n").trim(),
    metadata: Array.from(metadataSet),
  };
};

export const getNeteaseAudioUrl = (id: string) => {
  return `${METING_API}?type=url&id=${id}`;
};

// Implements the search logic from the user provided code snippet
export const searchNetEase = async (
  keyword: string,
  options: SearchOptions = {},
): Promise<NeteaseTrackInfo[]> => {
  const { limit = 20, offset = 0 } = options;
  const searchApiUrl = `${NETEASE_SEARCH_API}?keywords=${encodeURIComponent(
    keyword,
  )}&limit=${limit}&offset=${offset}`;

  try {
    const parsedSearchApiResponse = (await fetchWithFallback(
      searchApiUrl,
    )) as NeteaseSearchResponse;
    const songs = parsedSearchApiResponse.result?.songs ?? [];

    if (songs.length === 0) {
      console.warn(`No search results for: ${keyword}`);
      return [];
    }

    return songs.map(mapNeteaseSongToTrack);
  } catch (error) {
    console.error("NetEase search error", error);
    return [];
  }
};

export const fetchNeteasePlaylist = async (
  playlistId: string,
): Promise<NeteaseTrackInfo[]> => {
  try {
    // 使用網易雲音樂 API 獲取歌單所有歌曲
    // 由於接口限制，需要分頁獲取，每次獲取 50 首
    const allTracks: NeteaseTrackInfo[] = [];
    const limit = 50;
    let offset = 0;
    let shouldContinue = true;

    while (shouldContinue) {
      const url = `${NETEASECLOUD_API_BASE}/playlist/track/all?id=${playlistId}&limit=${limit}&offset=${offset}`;
      const data = (await fetchWithFallback(url)) as NeteasePlaylistResponse;
      const songs = data.songs ?? [];
      if (songs.length === 0) {
        break;
      }

      const tracks = songs.map(mapNeteaseSongToTrack);

      allTracks.push(...tracks);

      // Continue fetching if the current page was full
      if (songs.length < limit) {
        shouldContinue = false;
      } else {
        offset += limit;
      }
    }

    return allTracks;
  } catch (e) {
    console.error("Playlist fetch error", e);
    return [];
  }
};

export const fetchNeteaseSong = async (
  songId: string,
): Promise<NeteaseTrackInfo | null> => {
  try {
    const url = `${NETEASECLOUD_API_BASE}/song/detail?ids=${songId}`;
    const data = (await fetchWithFallback(
      url,
    )) as NeteaseSongDetailResponse;
    const track = data.songs?.[0];
    if (data.code === 200 && track) {
      return mapNeteaseSongToTrack(track);
    }
    return null;
  } catch (e) {
    console.error("Song fetch error", e);
    return null;
  }
};

// Keeps the old search for lyric matching fallbacks
export const searchAndMatchLyrics = async (
  title: string,
  artist: string,
): Promise<{ lrc: string; yrc?: string; tLrc?: string; metadata: string[] } | null> => {
  try {
    // 使用多平台并行搜索
    // 策略：网易云音乐和第三方API同时搜索，优先使用网易云的逐字歌词
    // 适合网易云没有版权的歌曲（如周杰伦）
    console.log("Using multi-platform lyrics search...");
    const multiPlatformResult = await multiPlatformSearch(title, artist);
    
    if (multiPlatformResult) {
      console.log(`✓ Found lyrics from ${multiPlatformResult.source}`);
      const sourceMap: Record<string, string> = {
        'qq': 'QQ音乐',
        'kugou': '酷狗音乐',
        'netease': '网易云音乐',
        'lrclib': 'LrcLib',
        'lrcapi': 'LRCAPI',
        'lyrics.ovh': 'Lyrics.ovh',
        'syair.info': 'Syair.info',
      };
      return {
        lrc: multiPlatformResult.lrc,
        yrc: multiPlatformResult.yrc,
        tLrc: multiPlatformResult.tLrc,
        metadata: [
          ...multiPlatformResult.metadata,
          `来源: ${sourceMap[multiPlatformResult.source] || multiPlatformResult.source}`,
        ],
      };
    }

    console.warn("No lyrics found on any platform");
    return null;
  } catch (error) {
    console.error("All lyrics search methods failed:", error);
    return null;
  }
};

export const fetchLyricsById = async (
  songId: string,
): Promise<{ lrc: string; yrc?: string; tLrc?: string; metadata: string[] } | null> => {
  try {
    // 使用網易雲音樂 API 獲取歌詞
    const lyricUrl = `${NETEASECLOUD_API_BASE}/lyric/new?id=${songId}`;
    const lyricData = await fetchWithFallback(lyricUrl);

    const rawYrc = lyricData.yrc?.lyric;
    const rawLrc = lyricData.lrc?.lyric;
    const tLrc = lyricData.tlyric?.lyric;

    if (!rawYrc && !rawLrc) {
      console.warn(`No lyrics found for song ${songId}`);
      return null;
    }

    const {
      clean: cleanLrc,
      metadata: lrcMetadata,
    } = rawLrc
        ? extractMetadataLines(rawLrc)
        : { clean: undefined, metadata: [] };

    const {
      clean: cleanYrc,
      metadata: yrcMetadata,
    } = rawYrc
        ? extractMetadataLines(rawYrc)
        : { clean: undefined, metadata: [] };

    // Extract metadata from translation if available
    let cleanTranslation: string | undefined;
    let translationMetadata: string[] = [];
    if (tLrc) {
      const result = extractMetadataLines(tLrc);
      cleanTranslation = result.clean;
      translationMetadata = result.metadata;
    }

    const metadataSet = Array.from(
      new Set([...lrcMetadata, ...yrcMetadata, ...translationMetadata]),
    );

    if (lyricData.transUser?.nickname) {
      metadataSet.unshift(`翻译贡献者: ${lyricData.transUser.nickname}`);
    }

    if (lyricData.lyricUser?.nickname) {
      metadataSet.unshift(`歌词贡献者: ${lyricData.lyricUser.nickname}`);
    }

    const baseLyrics = cleanLrc || cleanYrc || rawLrc || rawYrc;
    if (!baseLyrics) return null;

    const yrcForEnrichment = cleanYrc && cleanLrc ? cleanYrc : undefined;
    return {
      lrc: baseLyrics,
      yrc: yrcForEnrichment,
      tLrc: cleanTranslation,
      metadata: Array.from(metadataSet),
    };
  } catch (e) {
    console.error("Lyric fetch error for song", songId, e);
    return null;
  }
};
