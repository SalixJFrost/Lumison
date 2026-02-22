/**
 * 网易云音乐 API 扩展服务
 * Extended Netease Cloud Music API Service
 */

import { fetchViaProxy } from "../utils";

// API 基础地址
const API_ENDPOINTS = {
  primary: "https://163api.qijieya.cn",
  backup: [
    "https://netease-cloud-music-api-psi-ten.vercel.app",
    "https://music-api.heheda.top",
  ]
};

// API 请求配置
interface ApiRequestConfig {
  timeout?: number;
  retries?: number;
}

/**
 * 带重试和备用 API 的请求函数
 */
async function fetchWithFallback(
  endpoint: string,
  config: ApiRequestConfig = {}
): Promise<any> {
  const { timeout = 10000, retries = 2 } = config;
  const apis = [API_ENDPOINTS.primary, ...API_ENDPOINTS.backup];
  
  for (const baseUrl of apis) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const url = endpoint.includes('http') ? endpoint : `${baseUrl}${endpoint}`;
        console.log(`[Netease API] Trying: ${url} (attempt ${attempt + 1})`);
        
        const result = await Promise.race([
          fetchViaProxy(url),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), timeout)
          )
        ]);
        
        return result;
      } catch (error) {
        console.warn(`[Netease API] Failed: ${baseUrl} (attempt ${attempt + 1})`, error);
        if (attempt === retries) continue;
        await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒后重试
      }
    }
  }
  
  throw new Error("All Netease API endpoints failed");
}

// ==================== 类型定义 ====================

export interface NeteaseTrack {
  id: number;
  name: string;
  artists: Array<{ id: number; name: string }>;
  album: {
    id: number;
    name: string;
    picUrl: string;
  };
  duration: number;
  fee?: number; // 0: 免费, 1: VIP, 4: 购买专辑, 8: 非会员可免费播放低音质
  mvid?: number;
}

export interface NeteasePlaylist {
  id: number;
  name: string;
  coverImgUrl: string;
  creator: {
    userId: number;
    nickname: string;
    avatarUrl: string;
  };
  trackCount: number;
  playCount: number;
  description: string;
  tags: string[];
}

export interface NeteaseAlbum {
  id: number;
  name: string;
  picUrl: string;
  artist: {
    id: number;
    name: string;
  };
  publishTime: number;
  size: number;
  description: string;
}

export interface NeteaseArtist {
  id: number;
  name: string;
  picUrl: string;
  albumSize: number;
  musicSize: number;
  briefDesc: string;
}

export interface NeteaseLyric {
  lrc?: { lyric: string };
  tlyric?: { lyric: string };
  romalrc?: { lyric: string };
  yrc?: { lyric: string };
}

export interface NeteaseComment {
  commentId: number;
  content: string;
  time: number;
  likedCount: number;
  user: {
    userId: number;
    nickname: string;
    avatarUrl: string;
  };
}

// ==================== 搜索 API ====================

/**
 * 搜索歌曲
 */
export async function searchSongs(
  keyword: string,
  options: { limit?: number; offset?: number } = {}
): Promise<{ songs: NeteaseTrack[]; songCount: number }> {
  const { limit = 30, offset = 0 } = options;
  const endpoint = `/cloudsearch?keywords=${encodeURIComponent(keyword)}&type=1&limit=${limit}&offset=${offset}`;
  
  const data = await fetchWithFallback(endpoint);
  return {
    songs: data.result?.songs || [],
    songCount: data.result?.songCount || 0
  };
}

/**
 * 搜索歌单
 */
export async function searchPlaylists(
  keyword: string,
  options: { limit?: number; offset?: number } = {}
): Promise<{ playlists: NeteasePlaylist[]; playlistCount: number }> {
  const { limit = 30, offset = 0 } = options;
  const endpoint = `/cloudsearch?keywords=${encodeURIComponent(keyword)}&type=1000&limit=${limit}&offset=${offset}`;
  
  const data = await fetchWithFallback(endpoint);
  return {
    playlists: data.result?.playlists || [],
    playlistCount: data.result?.playlistCount || 0
  };
}

/**
 * 搜索专辑
 */
export async function searchAlbums(
  keyword: string,
  options: { limit?: number; offset?: number } = {}
): Promise<{ albums: NeteaseAlbum[]; albumCount: number }> {
  const { limit = 30, offset = 0 } = options;
  const endpoint = `/cloudsearch?keywords=${encodeURIComponent(keyword)}&type=10&limit=${limit}&offset=${offset}`;
  
  const data = await fetchWithFallback(endpoint);
  return {
    albums: data.result?.albums || [],
    albumCount: data.result?.albumCount || 0
  };
}

/**
 * 搜索歌手
 */
export async function searchArtists(
  keyword: string,
  options: { limit?: number; offset?: number } = {}
): Promise<{ artists: NeteaseArtist[]; artistCount: number }> {
  const { limit = 30, offset = 0 } = options;
  const endpoint = `/cloudsearch?keywords=${encodeURIComponent(keyword)}&type=100&limit=${limit}&offset=${offset}`;
  
  const data = await fetchWithFallback(endpoint);
  return {
    artists: data.result?.artists || [],
    artistCount: data.result?.artistCount || 0
  };
}

// ==================== 歌曲详情 API ====================

/**
 * 获取歌曲详情
 */
export async function getSongDetail(ids: number | number[]): Promise<NeteaseTrack[]> {
  const idStr = Array.isArray(ids) ? ids.join(',') : String(ids);
  const endpoint = `/song/detail?ids=${idStr}`;
  
  const data = await fetchWithFallback(endpoint);
  return data.songs || [];
}

/**
 * 获取歌曲播放 URL
 */
export async function getSongUrl(
  id: number,
  quality: 'standard' | 'higher' | 'exhigh' | 'lossless' = 'higher'
): Promise<{ url: string; br: number; size: number } | null> {
  const endpoint = `/song/url?id=${id}&br=${getBitrate(quality)}`;
  
  const data = await fetchWithFallback(endpoint);
  const urlData = data.data?.[0];
  
  if (!urlData || !urlData.url) {
    return null;
  }
  
  return {
    url: urlData.url,
    br: urlData.br,
    size: urlData.size
  };
}

function getBitrate(quality: string): number {
  const bitrateMap: Record<string, number> = {
    standard: 128000,
    higher: 320000,
    exhigh: 320000,
    lossless: 999000
  };
  return bitrateMap[quality] || 320000;
}

/**
 * 获取歌词
 */
export async function getLyric(id: number): Promise<NeteaseLyric> {
  const endpoint = `/lyric?id=${id}`;
  const data = await fetchWithFallback(endpoint);
  return data;
}

// ==================== 歌单 API ====================

/**
 * 获取歌单详情
 */
export async function getPlaylistDetail(id: number): Promise<{
  playlist: NeteasePlaylist;
  tracks: NeteaseTrack[];
}> {
  const endpoint = `/playlist/detail?id=${id}`;
  const data = await fetchWithFallback(endpoint);
  
  return {
    playlist: data.playlist,
    tracks: data.playlist?.tracks || []
  };
}

/**
 * 获取推荐歌单
 */
export async function getRecommendPlaylists(limit: number = 30): Promise<NeteasePlaylist[]> {
  const endpoint = `/personalized?limit=${limit}`;
  const data = await fetchWithFallback(endpoint);
  return data.result || [];
}

/**
 * 获取精品歌单
 */
export async function getTopPlaylists(
  category: string = '全部',
  options: { limit?: number; offset?: number } = {}
): Promise<{ playlists: NeteasePlaylist[]; total: number }> {
  const { limit = 50, offset = 0 } = options;
  const endpoint = `/top/playlist?cat=${encodeURIComponent(category)}&limit=${limit}&offset=${offset}`;
  
  const data = await fetchWithFallback(endpoint);
  return {
    playlists: data.playlists || [],
    total: data.total || 0
  };
}

// ==================== 专辑 API ====================

/**
 * 获取专辑详情
 */
export async function getAlbumDetail(id: number): Promise<{
  album: NeteaseAlbum;
  songs: NeteaseTrack[];
}> {
  const endpoint = `/album?id=${id}`;
  const data = await fetchWithFallback(endpoint);
  
  return {
    album: data.album,
    songs: data.songs || []
  };
}

/**
 * 获取最新专辑
 */
export async function getNewAlbums(
  options: { limit?: number; offset?: number; area?: string } = {}
): Promise<NeteaseAlbum[]> {
  const { limit = 30, offset = 0, area = 'ALL' } = options;
  const endpoint = `/album/new?limit=${limit}&offset=${offset}&area=${area}`;
  
  const data = await fetchWithFallback(endpoint);
  return data.albums || [];
}

// ==================== 歌手 API ====================

/**
 * 获取歌手详情
 */
export async function getArtistDetail(id: number): Promise<NeteaseArtist> {
  const endpoint = `/artist/detail?id=${id}`;
  const data = await fetchWithFallback(endpoint);
  return data.data?.artist || {};
}

/**
 * 获取歌手热门歌曲
 */
export async function getArtistTopSongs(id: number): Promise<NeteaseTrack[]> {
  const endpoint = `/artist/top/song?id=${id}`;
  const data = await fetchWithFallback(endpoint);
  return data.songs || [];
}

/**
 * 获取歌手专辑
 */
export async function getArtistAlbums(
  id: number,
  options: { limit?: number; offset?: number } = {}
): Promise<{ albums: NeteaseAlbum[]; more: boolean }> {
  const { limit = 30, offset = 0 } = options;
  const endpoint = `/artist/album?id=${id}&limit=${limit}&offset=${offset}`;
  
  const data = await fetchWithFallback(endpoint);
  return {
    albums: data.hotAlbums || [],
    more: data.more || false
  };
}

// ==================== 排行榜 API ====================

/**
 * 获取所有排行榜
 */
export async function getToplistDetail(): Promise<any[]> {
  const endpoint = `/toplist/detail`;
  const data = await fetchWithFallback(endpoint);
  return data.list || [];
}

/**
 * 获取指定排行榜
 */
export async function getToplist(id: number): Promise<{
  playlist: NeteasePlaylist;
  tracks: NeteaseTrack[];
}> {
  const endpoint = `/playlist/detail?id=${id}`;
  const data = await fetchWithFallback(endpoint);
  
  return {
    playlist: data.playlist,
    tracks: data.playlist?.tracks || []
  };
}

// ==================== 评论 API ====================

/**
 * 获取歌曲评论
 */
export async function getSongComments(
  id: number,
  options: { limit?: number; offset?: number; type?: 'hot' | 'new' } = {}
): Promise<{ comments: NeteaseComment[]; total: number; hotComments: NeteaseComment[] }> {
  const { limit = 20, offset = 0, type = 'new' } = options;
  const endpoint = `/comment/music?id=${id}&limit=${limit}&offset=${offset}&type=${type === 'hot' ? 1 : 2}`;
  
  const data = await fetchWithFallback(endpoint);
  return {
    comments: data.comments || [],
    total: data.total || 0,
    hotComments: data.hotComments || []
  };
}

// ==================== 推荐 API ====================

/**
 * 获取每日推荐歌曲（需要登录）
 */
export async function getDailyRecommendSongs(): Promise<NeteaseTrack[]> {
  const endpoint = `/recommend/songs`;
  const data = await fetchWithFallback(endpoint);
  return data.data?.dailySongs || [];
}

/**
 * 获取相似歌曲
 */
export async function getSimilarSongs(
  id: number,
  limit: number = 50
): Promise<NeteaseTrack[]> {
  const endpoint = `/simi/song?id=${id}&limit=${limit}`;
  const data = await fetchWithFallback(endpoint);
  return data.songs || [];
}

/**
 * 获取相似歌单
 */
export async function getSimilarPlaylists(
  id: number,
  limit: number = 50
): Promise<NeteasePlaylist[]> {
  const endpoint = `/simi/playlist?id=${id}&limit=${limit}`;
  const data = await fetchWithFallback(endpoint);
  return data.playlists || [];
}

// ==================== 其他 API ====================

/**
 * 获取热搜列表
 */
export async function getHotSearchList(): Promise<Array<{ searchWord: string; score: number }>> {
  const endpoint = `/search/hot/detail`;
  const data = await fetchWithFallback(endpoint);
  return data.data || [];
}

/**
 * 获取搜索建议
 */
export async function getSearchSuggest(keyword: string): Promise<{
  songs?: NeteaseTrack[];
  artists?: NeteaseArtist[];
  albums?: NeteaseAlbum[];
  playlists?: NeteasePlaylist[];
}> {
  const endpoint = `/search/suggest?keywords=${encodeURIComponent(keyword)}&type=mobile`;
  const data = await fetchWithFallback(endpoint);
  return data.result || {};
}

/**
 * 检查音乐是否可用
 */
export async function checkMusicAvailable(id: number): Promise<{
  success: boolean;
  message: string;
}> {
  const endpoint = `/check/music?id=${id}`;
  const data = await fetchWithFallback(endpoint);
  return data;
}

// ==================== 导出便捷函数 ====================

/**
 * 快速搜索并获取第一首歌曲
 */
export async function quickSearchSong(keyword: string): Promise<NeteaseTrack | null> {
  const { songs } = await searchSongs(keyword, { limit: 1 });
  return songs[0] || null;
}

/**
 * 获取完整歌曲信息（包括播放 URL 和歌词）
 */
export async function getCompleteSongInfo(id: number): Promise<{
  detail: NeteaseTrack;
  url: string | null;
  lyric: NeteaseLyric;
}> {
  const [details, urlData, lyric] = await Promise.all([
    getSongDetail(id),
    getSongUrl(id),
    getLyric(id)
  ]);
  
  return {
    detail: details[0],
    url: urlData?.url || null,
    lyric
  };
}

export default {
  // 搜索
  searchSongs,
  searchPlaylists,
  searchAlbums,
  searchArtists,
  
  // 歌曲
  getSongDetail,
  getSongUrl,
  getLyric,
  
  // 歌单
  getPlaylistDetail,
  getRecommendPlaylists,
  getTopPlaylists,
  
  // 专辑
  getAlbumDetail,
  getNewAlbums,
  
  // 歌手
  getArtistDetail,
  getArtistTopSongs,
  getArtistAlbums,
  
  // 排行榜
  getToplistDetail,
  getToplist,
  
  // 评论
  getSongComments,
  
  // 推荐
  getDailyRecommendSongs,
  getSimilarSongs,
  getSimilarPlaylists,
  
  // 其他
  getHotSearchList,
  getSearchSuggest,
  checkMusicAvailable,
  
  // 便捷函数
  quickSearchSong,
  getCompleteSongInfo
};
