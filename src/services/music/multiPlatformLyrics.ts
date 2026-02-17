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
    cover: "https://y.qq.com/music/photo_new/T002R300x300M000", // 封面 URL 前缀
  },
  // 酷狗音乐 API
  kugou: {
    search: "https://complexsearch.kugou.com/v2/search/song",
    lyric: "https://krcs.kugou.com/search",
  },
  // 网易云音乐 API（多个镜像，自动选择最快的）
  netease: [
    // 官方社区 API 镜像（优先）
    "https://163api.qijieya.cn",
    "https://netease-cloud-music-api-psi-ten.vercel.app",
    "https://music-api.heheda.top",
    "https://netease-api.fe-mm.com",
    
    // 第三方聚合 API（备用）
    "https://api.no0a.cn/api/cloudmusic",
    "https://api.injahow.cn/netease",
    "https://api.uomg.com/api/rand.music",
    
    // 更多社区部署的镜像
    "https://netease-music-api.vercel.app",
    "https://music.ghxi.com",
    "https://api.mlwei.com/music",
  ],
  // YouTube Music (需要特殊处理)
  youtube: {
    search: "https://music.youtube.com/youtubei/v1/search",
  },
};

// 网易云 API 性能统计
const neteaseApiStats = API_ENDPOINTS.netease.map(url => ({
  url,
  responseTimes: [] as number[],
  failCount: 0,
}));

/**
 * 获取最快的网易云 API
 */
const getFastestNeteaseApi = (): string => {
  // 计算每个 API 的平均响应时间
  const sorted = [...neteaseApiStats].sort((a, b) => {
    const avgA = a.responseTimes.length > 0 
      ? a.responseTimes.reduce((sum, t) => sum + t, 0) / a.responseTimes.length 
      : Infinity;
    const avgB = b.responseTimes.length > 0 
      ? b.responseTimes.reduce((sum, t) => sum + t, 0) / b.responseTimes.length 
      : Infinity;
    
    // 失败次数也作为参考
    return (avgA + a.failCount * 1000) - (avgB + b.failCount * 1000);
  });
  
  return sorted[0].url;
};

/**
 * 记录网易云 API 性能
 */
const recordNeteaseApiPerformance = (url: string, responseTime: number, success: boolean) => {
  const stat = neteaseApiStats.find(s => s.url === url);
  if (!stat) return;
  
  if (success) {
    stat.responseTimes.push(responseTime);
    // 只保留最近 10 次记录
    if (stat.responseTimes.length > 10) {
      stat.responseTimes.shift();
    }
  } else {
    stat.failCount++;
  }
};

interface LyricsResult {
  lrc: string;
  yrc?: string;
  tLrc?: string;
  metadata: string[];
  source: "qq" | "kugou" | "netease" | "youtube";
  coverUrl?: string; // 新增：封面 URL
  responseTime?: number; // 新增：响应时间（毫秒）
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
 * QQ 音乐获取歌词和封面
 */
const fetchQQMusicLyrics = async (songmid: string, albumMid?: string): Promise<LyricsResult | null> => {
  const startTime = Date.now();
  try {
    const url = `${API_ENDPOINTS.qq.lyric}?songmid=${songmid}&format=json&nobase64=1`;
    const response = await fetchViaProxy(url);
    
    if (!response?.lyric) return null;

    const responseTime = Date.now() - startTime;
    
    // 构建封面 URL
    const coverUrl = albumMid ? `${API_ENDPOINTS.qq.cover}${albumMid}.jpg` : undefined;

    return {
      lrc: response.lyric,
      tLrc: response.trans || undefined,
      metadata: [],
      source: "qq",
      coverUrl,
      responseTime,
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
 * 酷狗音乐获取歌词和封面
 */
const fetchKugouMusicLyrics = async (hash: string, imgUrl?: string): Promise<LyricsResult | null> => {
  const startTime = Date.now();
  try {
    const url = `${API_ENDPOINTS.kugou.lyric}?ver=1&man=yes&client=mobi&hash=${hash}`;
    const response = await fetchViaProxy(url);
    
    if (!response?.candidates?.[0]?.content) return null;

    const content = response.candidates[0].content;
    const responseTime = Date.now() - startTime;
    
    return {
      lrc: content,
      metadata: [],
      source: "kugou",
      coverUrl: imgUrl,
      responseTime,
    };
  } catch (error) {
    console.warn("Kugou Music lyrics fetch failed:", error);
    return null;
  }
};

/**
 * 网易云音乐搜索（使用最快的 API）
 */
const searchNeteaseMusic = async (keyword: string): Promise<any> => {
  const apiUrl = getFastestNeteaseApi();
  const startTime = Date.now();
  
  try {
    const url = `${apiUrl}/cloudsearch?keywords=${encodeURIComponent(keyword)}&limit=5`;
    const response = await fetchViaProxy(url);
    const responseTime = Date.now() - startTime;
    
    recordNeteaseApiPerformance(apiUrl, responseTime, true);
    return response?.result?.songs?.[0];
  } catch (error) {
    recordNeteaseApiPerformance(apiUrl, 0, false);
    console.warn("Netease Music search failed:", error);
    return null;
  }
};

/**
 * 网易云音乐获取歌词和封面
 */
const fetchNeteaseMusicLyrics = async (songId: string, coverUrl?: string): Promise<LyricsResult | null> => {
  const apiUrl = getFastestNeteaseApi();
  const startTime = Date.now();
  
  try {
    const url = `${apiUrl}/lyric/new?id=${songId}`;
    const response = await fetchViaProxy(url);
    
    if (!response?.lrc?.lyric) {
      recordNeteaseApiPerformance(apiUrl, 0, false);
      return null;
    }

    const responseTime = Date.now() - startTime;
    recordNeteaseApiPerformance(apiUrl, responseTime, true);

    return {
      lrc: response.lrc.lyric,
      yrc: response.yrc?.lyric,
      tLrc: response.tlyric?.lyric,
      metadata: [],
      source: "netease",
      coverUrl,
      responseTime,
    };
  } catch (error) {
    recordNeteaseApiPerformance(apiUrl, 0, false);
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
          const coverUrl = neteaseSong.al?.picUrl;
          const lyrics = await fetchNeteaseMusicLyrics(neteaseSong.id.toString(), coverUrl);
          if (lyrics) {
            console.log(`✓ Found lyrics on Netease Music (${lyrics.responseTime}ms)`);
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
          const albumMid = qqSong?.albummid;
          const lyrics = await fetchQQMusicLyrics(qqSong.songmid, albumMid);
          if (lyrics) {
            console.log(`✓ Found lyrics on QQ Music (${lyrics.responseTime}ms)`);
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
          const imgUrl = kugouSong?.ImgUrl;
          const lyrics = await fetchKugouMusicLyrics(kugouSong.FileHash, imgUrl);
          if (lyrics) {
            console.log(`✓ Found lyrics on Kugou Music (${lyrics.responseTime}ms)`);
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

/**
 * 测试所有网易云 API 的可用性和速度
 * 用于初始化或定期检查 API 健康状态
 */
export const testNeteaseApis = async (): Promise<void> => {
  console.log("Testing Netease API mirrors...");
  
  const testPromises = API_ENDPOINTS.netease.map(async (apiUrl) => {
    const startTime = Date.now();
    try {
      // 使用一个简单的搜索请求测试
      const url = `${apiUrl}/cloudsearch?keywords=test&limit=1`;
      await fetchViaProxy(url);
      const responseTime = Date.now() - startTime;
      
      recordNeteaseApiPerformance(apiUrl, responseTime, true);
      console.log(`✓ ${apiUrl}: ${responseTime}ms`);
      return { url: apiUrl, success: true, time: responseTime };
    } catch (error) {
      recordNeteaseApiPerformance(apiUrl, 0, false);
      console.warn(`✗ ${apiUrl}: failed`);
      return { url: apiUrl, success: false, time: Infinity };
    }
  });
  
  await Promise.allSettled(testPromises);
  console.log(`Fastest API: ${getFastestNeteaseApi()}`);
};

/**
 * 获取 API 性能统计信息
 */
export const getApiStats = () => {
  return {
    netease: neteaseApiStats.map(stat => ({
      url: stat.url,
      avgResponseTime: stat.responseTimes.length > 0
        ? Math.round(stat.responseTimes.reduce((a, b) => a + b, 0) / stat.responseTimes.length)
        : null,
      failCount: stat.failCount,
      requestCount: stat.responseTimes.length,
    })),
    fastestApi: getFastestNeteaseApi(),
  };
};

/**
 * 重置 API 统计数据
 */
export const resetApiStats = () => {
  neteaseApiStats.forEach(stat => {
    stat.responseTimes = [];
    stat.failCount = 0;
  });
  console.log("API stats reset");
};
