import { fetchViaProxy } from "../utils";
import { fetchAudioAsBlob } from "../corsProxy";

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
    cid?: number;
  };
}

interface BilibiliPlayUrl {
  code: number;
  data?: {
    dash?: {
      audio?: Array<{
        id: number;
        baseUrl: string;
        backupUrl?: string[];
        bandwidth: number;
        mimeType: string;
        codecs: string;
      }>;
    };
    durl?: Array<{
      url: string;
      backup_url?: string[];
    }>;
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
 * Get CID for Bilibili video
 */
const getBilibiliCid = async (bvid: string): Promise<number | null> => {
  try {
    const url = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
    const data = (await fetchViaProxy(url)) as BilibiliVideoInfo;
    
    if (data.code === 0 && data.data?.cid) {
      return data.data.cid;
    }
    
    return null;
  } catch (error) {
    console.error("Failed to get Bilibili CID:", error);
    return null;
  }
};

/**
 * Get Bilibili audio stream URL and convert to blob URL
 * This method fetches the audio as a blob to bypass CORS restrictions
 */
export const getBilibiliAudioUrl = async (
  videoId: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<string | null> => {
  try {
    // Get CID first
    const cid = await getBilibiliCid(videoId);
    if (!cid) {
      console.error("Failed to get CID for video:", videoId);
      return null;
    }

    // Get play URL with audio stream
    const playUrl = `https://api.bilibili.com/x/player/playurl?bvid=${videoId}&cid=${cid}&qn=64&fnval=16&fourk=1`;
    
    const data = (await fetchViaProxy(playUrl)) as BilibiliPlayUrl;

    if (data.code === 0 && data.data) {
      let audioStreamUrl: string | null = null;
      
      // Try DASH audio first (better quality)
      if (data.data.dash?.audio && data.data.dash.audio.length > 0) {
        // Sort by bandwidth (quality) and get the best one
        const bestAudio = data.data.dash.audio.sort((a, b) => b.bandwidth - a.bandwidth)[0];
        audioStreamUrl = bestAudio.baseUrl;
      }
      // Fallback to durl (older format)
      else if (data.data.durl && data.data.durl.length > 0) {
        audioStreamUrl = data.data.durl[0].url;
      }

      if (!audioStreamUrl) {
        console.error("No audio stream found for video:", videoId);
        return null;
      }

      // Fetch audio as blob to bypass CORS
      console.log("Fetching Bilibili audio stream...");
      const blob = await fetchAudioAsBlob(audioStreamUrl, onProgress);
      
      // Create object URL from blob
      const blobUrl = URL.createObjectURL(blob);
      console.log("Bilibili audio loaded successfully");
      
      return blobUrl;
    }

    console.error("No audio stream found for video:", videoId);
    return null;
  } catch (error) {
    console.error("Failed to get Bilibili audio URL:", error);
    return null;
  }
};

/**
 * Check if browser supports hardware decoding for given codec
 */
export const checkHardwareDecoding = async (mimeType: string): Promise<boolean> => {
  if (!('mediaCapabilities' in navigator)) {
    return false;
  }

  try {
    const config = {
      type: 'file' as const,
      audio: {
        contentType: mimeType,
        channels: 2,
        bitrate: 128000,
        samplerate: 48000,
      },
    };

    const result = await navigator.mediaCapabilities.decodingInfo(config);
    return result.supported && result.smooth && result.powerEfficient;
  } catch (error) {
    console.warn('Hardware decoding check failed:', error);
    return false;
  }
};

/**
 * Get best audio format based on browser capabilities
 */
export const getBestAudioFormat = async (
  audioStreams: Array<{
    id: number;
    baseUrl: string;
    mimeType: string;
    codecs: string;
    bandwidth: number;
  }>
): Promise<string | null> => {
  // Check hardware decoding support for each format
  const formatChecks = await Promise.all(
    audioStreams.map(async (stream) => ({
      url: stream.baseUrl,
      mimeType: stream.mimeType,
      bandwidth: stream.bandwidth,
      hardwareSupported: await checkHardwareDecoding(stream.mimeType),
    }))
  );

  // Prefer hardware-decoded formats
  const hardwareSupported = formatChecks.filter((f) => f.hardwareSupported);
  if (hardwareSupported.length > 0) {
    // Get highest quality among hardware-supported formats
    const best = hardwareSupported.sort((a, b) => b.bandwidth - a.bandwidth)[0];
    console.log('Using hardware-accelerated audio format:', best.mimeType);
    return best.url;
  }

  // Fallback to highest quality software-decoded format
  const best = formatChecks.sort((a, b) => b.bandwidth - a.bandwidth)[0];
  console.log('Using software-decoded audio format:', best.mimeType);
  return best.url;
};
