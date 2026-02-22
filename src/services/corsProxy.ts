/**
 * CORS Proxy Service
 * Handles CORS restrictions for external APIs
 */

// List of public CORS proxies (use with caution in production)
// 优先使用更可靠的代理服务
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  // 'https://cors-anywhere.herokuapp.com/', // 已移除，需要请求访问权限
];

let currentProxyIndex = 0;
const failedProxies = new Set<string>();

/**
 * Get current CORS proxy URL
 */
export const getCorsProxy = (): string => {
  // 跳过已失败的代理
  let attempts = 0;
  while (failedProxies.has(CORS_PROXIES[currentProxyIndex]) && attempts < CORS_PROXIES.length) {
    currentProxyIndex = (currentProxyIndex + 1) % CORS_PROXIES.length;
    attempts++;
  }
  return CORS_PROXIES[currentProxyIndex];
};

/**
 * Mark proxy as failed
 */
const markProxyFailed = (proxy: string): void => {
  failedProxies.add(proxy);
  // 5分钟后重置失败标记
  setTimeout(() => {
    failedProxies.delete(proxy);
  }, 5 * 60 * 1000);
};

/**
 * Rotate to next CORS proxy
 */
export const rotateProxy = (): void => {
  currentProxyIndex = (currentProxyIndex + 1) % CORS_PROXIES.length;
  console.log('Rotated to proxy:', CORS_PROXIES[currentProxyIndex]);
};

/**
 * Fetch with CORS proxy
 * Automatically retries with different proxies on failure
 */
export const fetchWithCorsProxy = async (
  url: string,
  options?: RequestInit,
  maxRetries: number = 2 // 减少重试次数，加快失败响应
): Promise<Response> => {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const proxy = getCorsProxy();
      const proxiedUrl = proxy + encodeURIComponent(url);
      
      const response = await fetch(proxiedUrl, {
        ...options,
        headers: {
          ...options?.headers,
          'X-Requested-With': 'XMLHttpRequest',
        },
        signal: AbortSignal.timeout(10000), // 10秒超时
      });
      
      if (response.ok) {
        return response;
      }
      
      // If response is not ok, mark proxy as failed and try next
      console.warn(`Proxy ${proxy} failed with status ${response.status}`);
      markProxyFailed(proxy);
      rotateProxy();
    } catch (error) {
      console.warn(`Proxy attempt ${i + 1} failed:`, error);
      lastError = error as Error;
      const currentProxy = CORS_PROXIES[currentProxyIndex];
      markProxyFailed(currentProxy);
      rotateProxy();
    }
  }
  
  throw lastError || new Error('All CORS proxy attempts failed');
};

/**
 * Try direct fetch first, fallback to CORS proxy
 */
export const fetchWithFallback = async (
  url: string,
  options?: RequestInit
): Promise<Response> => {
  try {
    // Try direct fetch first with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      return response;
    }
  } catch (error) {
    console.log('Direct fetch failed (likely CORS), trying proxy:', error);
  }
  
  // Fallback to CORS proxy
  return fetchWithCorsProxy(url, options);
};

/**
 * Create a proxied audio URL that can be used with audio element
 * This adds necessary headers for Bilibili audio streams
 */
export const createProxiedAudioUrl = (originalUrl: string): string => {
  // For Bilibili, we need to add Referer header
  // Since we can't add headers to <audio> src, we need a different approach
  
  // Option 1: Use a CORS proxy that supports custom headers
  // Option 2: Fetch the audio as blob and create object URL
  // Option 3: Use a backend proxy service
  
  // For now, return the original URL with CORS proxy
  // Note: This may not work for all Bilibili videos due to header requirements
  return getCorsProxy() + encodeURIComponent(originalUrl);
};

/**
 * Fetch audio as blob with proper headers
 * This is the most reliable method for Bilibili audio
 */
export const fetchAudioAsBlob = async (
  url: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<Blob> => {
  const response = await fetch(url, {
    headers: {
      'Referer': 'https://www.bilibili.com',
      'User-Agent': navigator.userAgent,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch audio: ${response.status}`);
  }
  
  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;
  
  if (!response.body) {
    throw new Error('Response body is null');
  }
  
  const reader = response.body.getReader();
  const chunks: BlobPart[] = [];
  let loaded = 0;
  
  while (true) {
    const { done, value } = await reader.read();
    
    if (done) break;
    
    if (value) {
      chunks.push(value);
      loaded += value.length;
      
      if (onProgress && total > 0) {
        onProgress(loaded, total);
      }
    }
  }
  
  const blob = new Blob(chunks, {
    type: response.headers.get('content-type') || 'audio/mpeg',
  });
  
  return blob;
};
