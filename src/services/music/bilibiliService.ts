import { fetchViaProxy } from "../utils";

export interface BilibiliTrackInfo {
  id: string;
  title: string;
  artist: string;
  coverUrl?: string;
  duration?: number;
  isBilibili: true;
  bilibiliId: string;
  bvid?: string;
}

interface BilibiliVideoInfo {
  code: number;
  data?: {
    title?: string;
    owner?: {
      name?: string;
    };
    pic?: string;
    duration?: number;
    bvid?: string;
  };
}

/**
 * Fetch Bilibili video information
 */
export const fetchBilibiliVideo = async (
  videoId: string,
): Promise<BilibiliTrackInfo | null> => {
  try {
    // Use Bilibili API to get video info
    const url = `https://api.bilibili.com/x/web-interface/view?bvid=${videoId}`;
    const data = (await fetchViaProxy(url)) as BilibiliVideoInfo;

    if (data.code === 0 && data.data) {
      const { title, owner, pic, duration, bvid } = data.data;
      
      return {
        id: videoId,
        title: title || "Unknown Title",
        artist: owner?.name || "Unknown Artist",
        coverUrl: pic?.startsWith("http:") ? pic.replace("http:", "https:") : pic,
        duration: duration ? duration * 1000 : undefined, // Convert to milliseconds
        isBilibili: true,
        bilibiliId: videoId,
        bvid: bvid,
      };
    }

    return null;
  } catch (error) {
    console.error("Failed to fetch Bilibili video info:", error);
    return null;
  }
};

/**
 * Get Bilibili audio URL
 * Note: This is a placeholder. In production, you would need to:
 * 1. Extract audio from video using a backend service
 * 2. Or use Bilibili's audio API if available
 * 3. Handle authentication and rate limiting
 */
export const getBilibiliAudioUrl = (videoId: string): string => {
  // This is a placeholder URL
  // In a real implementation, you would need a backend service to:
  // 1. Fetch the video stream URL from Bilibili API
  // 2. Extract audio track
  // 3. Serve it with proper CORS headers
  
  // For now, return a placeholder that indicates this needs backend support
  return `https://api.example.com/bilibili/audio/${videoId}`;
};

/**
 * Note: Bilibili audio extraction requires backend support due to:
 * 1. CORS restrictions on Bilibili's CDN
 * 2. Need to parse video streams and extract audio
 * 3. Authentication requirements
 * 
 * Recommended approach:
 * - Set up a backend service (Node.js/Python)
 * - Use libraries like youtube-dl or you-get to extract audio
 * - Serve audio with proper CORS headers
 * - Cache extracted audio to reduce API calls
 */
