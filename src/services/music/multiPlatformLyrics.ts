import { fetchViaProxy } from "../utils";

/**
 * 多平台歌词服务
 * 优先级：QQ音乐 > 酷狗音乐 > 网易云音乐 > YouTube Music
 */

// API 端点配置
const API_ENDPOINTS = {
  // QQ 音乐 API
  qq: {
    search: "https://c.y.qq.com/soso/fcgi-bin/client_search_cp",
    lyric: "https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg",
  },
  // 酷狗音乐 API
  kugou: {
    search: "https://complexsearch.kugou.com/v2/search/song",
    lyric: "https://krcs.kugou.com/search",
  },
  // 网易云音乐 API
  netease: {
    search: "https://163api.qijieya.cn/cloudsearch",
    lyric: "https://163api.qijieya.cn/lyric/new",
  },
  // YouTube Music (需要特殊处理)
  youtube: {
    search: "https://music.youtube.com/youtubei/v1/search",
  },
};

interface LyricsResult {
  lrc: string;
  yrc?: string;
  tLrc?: string;
  metadata: string[];
  source: "qq" | "kugou" | "netease" | "youtube";
}

/**
 * QQ 音乐搜索
 */
const searchQQMusic = async (keyword: string): Promise<any> => {
  try {
    const url = `${API_ENDPOINTS.qq.search}?w=${encodeURIComponent(keyword)}&p=1&n=5&format=json`;
    const response = await fetchViaProxy(url);
    return response?.data?.song?.list?.[0];
  } catch (error) {
    console.warn("QQ Music search failed:", error);
    return null;
  }
};

/**
 * QQ 音乐获取歌词
 */
const fetchQQMusicLyrics = async (songmid: string): Promise<LyricsResult | null> => {
  try {
    const url = `${API_ENDPOINTS.qq.lyric}?songmid=${songmid}&format=json&nobase64=1`;
    const response = await fetchViaProxy(url);
    
    if (!response?.lyric) return null;

    return {
      lrc: response.lyric,
      tLrc: response.trans || undefined,
      metadata: [],
      source: "qq",
    };
  } catch (error) {
    console.warn("QQ Music lyrics fetch failed:", error);
    return null;
  }
};

/**
 * 酷狗音乐搜索
 */
const searchKugouMusic = async (keyword: string): Promise<any> => {
  try {
    const url = `${API_ENDPOINTS.kugou.search}?keyword=${encodeURIComponent(keyword)}&page=1&pagesize=5`;
    const response = await fetchViaProxy(url);
    return response?.data?.lists?.[0];
  } catch (error) {
    console.warn("Kugou Music search failed:", error);
    return null;
  }
};

/**
 * 酷狗音乐获取歌词
 */
const fetchKugouMusicLyrics = async (hash: string): Promise<LyricsResult | null> => {
  try {
    const url = `${API_ENDPOINTS.kugou.lyric}?ver=1&man=yes&client=mobi&hash=${hash}`;
    const response = await fetchViaProxy(url);
    
    if (!response?.candidates?.[0]?.content) return null;

    const content = response.candidates[0].content;
    
    return {
      lrc: content,
      metadata: [],
      source: "kugou",
    };
  } catch (error) {
    console.warn("Kugou Music lyrics fetch failed:", error);
    return null;
  }
};

/**
 * 网易云音乐搜索（保留作为备用）
 */
const searchNeteaseMusic = async (keyword: string): Promise<any> => {
  try {
    const url = `${API_ENDPOINTS.netease.search}?keywords=${encodeURIComponent(keyword)}&limit=5`;
    const response = await fetchViaProxy(url);
    return response?.result?.songs?.[0];
  } catch (error) {
    console.warn("Netease Music search failed:", error);
    return null;
  }
};

/**
 * 网易云音乐获取歌词（保留作为备用）
 */
const fetchNeteaseMusicLyrics = async (songId: string): Promise<LyricsResult | null> => {
  try {
    const url = `${API_ENDPOINTS.netease.lyric}?id=${songId}`;
    const response = await fetchViaProxy(url);
    
    if (!response?.lrc?.lyric) return null;

    return {
      lrc: response.lrc.lyric,
      yrc: response.yrc?.lyric,
      tLrc: response.tlyric?.lyric,
      metadata: [],
      source: "netease",
    };
  } catch (error) {
    console.warn("Netease Music lyrics fetch failed:", error);
    return null;
  }
};

/**
 * 多平台搜索并获取歌词
 * 策略：同时请求所有平台，哪个先返回用哪个（优先网易云）
 */
export const searchAndFetchLyrics = async (
  title: string,
  artist: string
): Promise<LyricsResult | null> => {
  const keyword = `${title} ${artist}`;
  console.log(`Searching lyrics for: ${keyword}`);

  // 创建所有平台的搜索 Promise
  const searchPromises = [
    // 网易云音乐（优先）
    (async () => {
      try {
        console.log("Trying Netease Music...");
        const neteaseSong = await searchNeteaseMusic(keyword);
        if (neteaseSong?.id) {
          const lyrics = await fetchNeteaseMusicLyrics(neteaseSong.id.toString());
          if (lyrics) {
            console.log("✓ Found lyrics on Netease Music");
            return lyrics;
          }
        }
        return null;
      } catch (error) {
        console.warn("Netease Music failed:", error);
        return null;
      }
    })(),
    
    // QQ 音乐
    (async () => {
      try {
        console.log("Trying QQ Music...");
        const qqSong = await searchQQMusic(keyword);
        if (qqSong?.songmid) {
          const lyrics = await fetchQQMusicLyrics(qqSong.songmid);
          if (lyrics) {
            console.log("✓ Found lyrics on QQ Music");
            return lyrics;
          }
        }
        return null;
      } catch (error) {
        console.warn("QQ Music failed:", error);
        return null;
      }
    })(),
    
    // 酷狗音乐
    (async () => {
      try {
        console.log("Trying Kugou Music...");
        const kugouSong = await searchKugouMusic(keyword);
        if (kugouSong?.FileHash) {
          const lyrics = await fetchKugouMusicLyrics(kugouSong.FileHash);
          if (lyrics) {
            console.log("✓ Found lyrics on Kugou Music");
            return lyrics;
          }
        }
        return null;
      } catch (error) {
        console.warn("Kugou Music failed:", error);
        return null;
      }
    })(),
  ];

  // 使用 Promise.race 获取最快的结果
  // 但如果第一个返回 null，继续等待其他的
  try {
    const results = await Promise.allSettled(searchPromises);
    
    // 优先返回网易云的结果（如果有）
    const neteaseResult = results[0].status === 'fulfilled' ? results[0].value : null;
    if (neteaseResult) {
      return neteaseResult;
    }
    
    // 否则返回任何成功的结果
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        return result.value;
      }
    }
    
    console.warn("No lyrics found on any platform");
    return null;
  } catch (error) {
    console.error("All platforms failed:", error);
    return null;
  }
};

/**
 * 根据平台 ID 直接获取歌词
 */
export const fetchLyricsByPlatform = async (
  platform: "qq" | "kugou" | "netease",
  id: string
): Promise<LyricsResult | null> => {
  switch (platform) {
    case "qq":
      return fetchQQMusicLyrics(id);
    case "kugou":
      return fetchKugouMusicLyrics(id);
    case "netease":
      return fetchNeteaseMusicLyrics(id);
    default:
      return null;
  }
};
