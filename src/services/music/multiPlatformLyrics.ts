import { fetchViaProxy } from "../utils";

/**
 * 多平台歌词服务
 * 策略：优先从网易云音乐获取歌词（支持逐字歌词和翻译）
 * 只有在网易云失败时才尝试第三方API
 * 第三方API包含多个源，适合网易云没有版权的歌曲（如周杰伦）
 */

// 平台启用配置
const PLATFORM_CONFIG = {
  netease: true,      // 网易云音乐 - 最稳定，支持逐字歌词
  thirdParty: true,   // 第三方歌词 API
};

// 第三方 API 黑名单（失败的源会被临时禁用）
const failedSources = new Set<string>();
const BLACKLIST_DURATION = 5 * 60 * 1000; // 5 分钟

/**
 * 标记源为失败
 */
const markSourceFailed = (source: string) => {
  if (!failedSources.has(source)) {
    console.warn(`⚠️ Blacklisting source: ${source} for ${BLACKLIST_DURATION / 1000}s`);
    failedSources.add(source);
    // 5 分钟后移除黑名单
    setTimeout(() => {
      failedSources.delete(source);
      console.log(`✓ Removed ${source} from blacklist`);
    }, BLACKLIST_DURATION);
  }
};

/**
 * 检查源是否被禁用
 */
const isSourceBlacklisted = (source: string): boolean => {
  return failedSources.has(source);
};

// API 端点配置
const API_ENDPOINTS = {
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
  source: "netease" | string;
  coverUrl?: string; // 新增：封面 URL
  responseTime?: number; // 新增：响应时间（毫秒）
}

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
 * 第三方歌词API搜索
 */
const searchThirdPartyLyricsAPIs = async (title: string, artist: string): Promise<LyricsResult | null> => {
  const startTime = Date.now();
  
  // LrcLib API - 最大的开源歌词库
  const tryLrcLib = async (): Promise<LyricsResult | null> => {
    if (isSourceBlacklisted('lrclib')) return null;
    try {
      const url = `https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`;
      const response = await fetchViaProxy(url);
      if (Array.isArray(response) && response.length > 0) {
        const result = response[0];
        const lrc = result.syncedLyrics || result.plainLyrics;
        if (lrc) {
          return {
            lrc,
            metadata: [],
            source: "lrclib",
            responseTime: Date.now() - startTime,
          };
        }
      }
    } catch (error) {
      console.warn("LrcLib failed:", error);
      markSourceFailed('lrclib');
    }
    return null;
  };

  // LRCAPI - 支持多语言歌词
  const tryLRCAPI = async (): Promise<LyricsResult | null> => {
    if (isSourceBlacklisted('lrcapi')) return null;
    try {
      const url = `https://lrc.xms.mx/search?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`;
      const response = await fetchViaProxy(url);
      if (response?.data && Array.isArray(response.data) && response.data.length > 0) {
        const result = response.data[0];
        if (result.lrc) {
          return {
            lrc: result.lrc,
            metadata: [],
            source: "lrcapi",
            responseTime: Date.now() - startTime,
          };
        }
      }
    } catch (error) {
      console.warn("LRCAPI failed:", error);
      markSourceFailed('lrcapi');
    }
    return null;
  };

  // Lyrics.ovh - 简单但覆盖广
  const tryLyricsOvh = async (): Promise<LyricsResult | null> => {
    if (isSourceBlacklisted('lyrics.ovh')) return null;
    try {
      // 修复：正确的参数顺序是 artist/title
      const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
      const response = await fetchViaProxy(url);
      if (response && response.lyrics) {
        // 转换为 LRC 格式（简单时间戳）
        const lines = response.lyrics.split('\n').filter((line: string) => line.trim());
        const lrc = lines.map((line: string, index: number) => {
          const time = index * 3;
          const minutes = Math.floor(time / 60);
          const seconds = time % 60;
          return `[${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.00]${line}`;
        }).join('\n');
        return {
          lrc,
          metadata: [],
          source: "lyrics.ovh",
          responseTime: Date.now() - startTime,
        };
      }
    } catch (error) {
      console.warn("Lyrics.ovh failed:", error);
      markSourceFailed('lyrics.ovh');
    }
    return null;
  };

  // Syair.info - 亚洲音乐覆盖好
  const trySyairInfo = async (): Promise<LyricsResult | null> => {
    if (isSourceBlacklisted('syair.info')) return null;
    try {
      const url = `https://api.syair.info/lyrics/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
      const response = await fetchViaProxy(url);
      if (response && response.lyrics) {
        const lines = response.lyrics.split('\n').filter((line: string) => line.trim());
        const lrc = lines.map((line: string, index: number) => {
          const time = index * 3;
          const minutes = Math.floor(time / 60);
          const seconds = time % 60;
          return `[${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.00]${line}`;
        }).join('\n');
        return {
          lrc,
          metadata: [],
          source: "syair.info",
          responseTime: Date.now() - startTime,
        };
      }
    } catch (error) {
      console.warn("Syair.info failed:", error);
      markSourceFailed('syair.info');
    }
    return null;
  };

  // ChartLyrics - 免费，支持部分同步歌词（使用 HTTPS）
  const tryChartLyrics = async (): Promise<LyricsResult | null> => {
    if (isSourceBlacklisted('chartlyrics')) return null;
    try {
      const url = `https://api.chartlyrics.com/apiv1.asmx/SearchLyricDirect?artist=${encodeURIComponent(artist)}&song=${encodeURIComponent(title)}`;
      const response = await fetchViaProxy(url);
      if (response && typeof response === 'string' && response.includes('<Lyric>')) {
        const lyricMatch = response.match(/<Lyric>([\s\S]*?)<\/Lyric>/);
        if (lyricMatch && lyricMatch[1]) {
          const lyrics = lyricMatch[1].trim();
          if (lyrics && lyrics !== 'null') {
            const lines = lyrics.split('\n').filter((line: string) => line.trim());
            const lrc = lines.map((line: string, index: number) => {
              const time = index * 3;
              const minutes = Math.floor(time / 60);
              const seconds = time % 60;
              return `[${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.00]${line}`;
            }).join('\n');
            return {
              lrc,
              metadata: [],
              source: "chartlyrics",
              responseTime: Date.now() - startTime,
            };
          }
        }
      }
    } catch (error) {
      console.warn("ChartLyrics failed:", error);
      markSourceFailed('chartlyrics');
    }
    return null;
  };

  // Musixmatch - 全球最大歌词库
  const tryMusixmatch = async (): Promise<LyricsResult | null> => {
    if (isSourceBlacklisted('musixmatch')) return null;
    try {
      const url = `https://apic-desktop.musixmatch.com/ws/1.1/macro.subtitles.get?q_track=${encodeURIComponent(title)}&q_artist=${encodeURIComponent(artist)}&format=json&namespace=lyrics_synched`;
      const response = await fetchViaProxy(url);
      
      if (response?.message?.body?.macro_calls) {
        const subtitles = response.message.body.macro_calls['track.subtitles.get']?.message?.body?.subtitle_list;
        if (subtitles && subtitles.length > 0) {
          const subtitle = subtitles[0].subtitle;
          if (subtitle?.subtitle_body) {
            const lrcLines = JSON.parse(subtitle.subtitle_body);
            if (Array.isArray(lrcLines)) {
              const lrc = lrcLines.map((line: any) => {
                const time = line.time?.total || 0;
                const minutes = Math.floor(time / 60);
                const seconds = Math.floor(time % 60);
                const ms = Math.floor((time % 1) * 100);
                return `[${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(2, '0')}]${line.text || ''}`;
              }).join('\n');
              return {
                lrc,
                metadata: [],
                source: "musixmatch",
                responseTime: Date.now() - startTime,
              };
            }
          }
        }
      }
    } catch (error) {
      console.warn("Musixmatch failed:", error);
      markSourceFailed('musixmatch');
    }
    return null;
  };

  // OpenLyrics - 开源 LRC 歌词数据库
  const tryOpenLyrics = async (): Promise<LyricsResult | null> => {
    if (isSourceBlacklisted('openlyrics')) return null;
    try {
      const searchQuery = `${artist} - ${title}`;
      const mirrors = [
        'https://openlyrics.io/api/search',
        'https://api.openlyrics.org/search',
      ];
      
      for (const mirror of mirrors) {
        try {
          const url = `${mirror}?q=${encodeURIComponent(searchQuery)}`;
          const response = await fetchViaProxy(url);
          
          if (response?.results && Array.isArray(response.results) && response.results.length > 0) {
            const result = response.results[0];
            if (result.lrc || result.lyrics) {
              return {
                lrc: result.lrc || result.lyrics,
                metadata: result.metadata || [],
                source: "openlyrics",
                responseTime: Date.now() - startTime,
              };
            }
          }
        } catch (err) {
          console.warn(`OpenLyrics mirror ${mirror} failed:`, err);
          continue;
        }
      }
    } catch (error) {
      console.warn("OpenLyrics failed:", error);
      markSourceFailed('openlyrics');
    }
    return null;
  };

  // 并发请求所有第三方API，返回最快的结果
  // 删除 LyricWiki（SSL 证书问题）和 Genius（需要后端支持）
  // 并发请求所有第三方API，返回最快的结果
  // 删除 LyricWiki（SSL 证书问题）、Genius（需要后端）、GitHub LRC（速率限制）
  const promises = [
    tryLrcLib(),
    tryLRCAPI(),
    tryLyricsOvh(),
    trySyairInfo(),
    tryChartLyrics(),
    tryMusixmatch(),
    tryOpenLyrics(),
  ];

  // 使用 Promise.race 获取最快的成功结果
  const racePromise = Promise.race(
    promises.map(async (p) => {
      const result = await p;
      if (result) return result;
      throw new Error('No result');
    })
  ).catch(() => null);

  // 同时等待所有结果，以防 race 失败
  const allResults = await Promise.allSettled(promises);
  
  // 先尝试 race 的结果（最快的）
  const fastestResult = await racePromise;
  if (fastestResult) {
    return fastestResult;
  }

  // 如果 race 失败，返回第一个成功的结果
  for (const result of allResults) {
    if (result.status === 'fulfilled' && result.value) {
      return result.value;
    }
  }

  return null;
};

/**
 * 多平台搜索并获取歌词
 * 策略：优先从网易云音乐获取歌词，只有在网易云失败时才尝试其他平台
 */
export const searchAndFetchLyrics = async (
  title: string,
  artist: string
): Promise<LyricsResult | null> => {
  const keyword = `${title} ${artist}`;
  console.log(`Searching lyrics for: ${keyword}`);

  // 第一优先级：网易云音乐（支持逐字歌词和翻译）
  if (PLATFORM_CONFIG.netease) {
    try {
      console.log("🎵 Trying Netease Music (Priority)...");
      const neteaseSong = await searchNeteaseMusic(keyword);
      if (neteaseSong?.id) {
        const coverUrl = neteaseSong.al?.picUrl;
        const lyrics = await fetchNeteaseMusicLyrics(neteaseSong.id.toString(), coverUrl);
        if (lyrics) {
          console.log(`✓ Found lyrics on Netease Music (${lyrics.responseTime}ms)`);
          return lyrics;
        }
      }
      console.log("⚠️ Netease Music: No lyrics found, trying fallback sources...");
    } catch (error) {
      console.warn("⚠️ Netease Music failed, trying fallback sources:", error);
    }
  }

  // 第二优先级：第三方歌词API（并行搜索多个源）
  if (PLATFORM_CONFIG.thirdParty) {
    try {
      console.log("🔍 Trying third-party lyrics APIs...");
      const thirdPartyResult = await searchThirdPartyLyricsAPIs(title, artist);
      if (thirdPartyResult) {
        console.log(`✓ Found lyrics on ${thirdPartyResult.source} (${thirdPartyResult.responseTime}ms)`);
        return thirdPartyResult;
      }
    } catch (error) {
      console.warn("Third-party APIs failed:", error);
    }
  }

  
  console.warn("No lyrics found on any platform");
  return null;
};

/**
 * 根据平台 ID 直接获取歌词
 */
export const fetchLyricsByPlatform = async (
  platform: "netease",
  id: string
): Promise<LyricsResult | null> => {
  if (platform === "netease") {
    return fetchNeteaseMusicLyrics(id);
  }
  return null;
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

/**
 * 获取平台配置
 * 可用于检查哪些平台已启用
 */
export const getPlatformConfig = () => {
  return { ...PLATFORM_CONFIG };
};

/**
 * 更新平台配置
 * 注意：需要重新加载页面才能生效
 */
export const updatePlatformConfig = (config: Partial<typeof PLATFORM_CONFIG>) => {
  Object.assign(PLATFORM_CONFIG, config);
  console.log("Platform config updated:", PLATFORM_CONFIG);
};
