/**
 * Performance optimization configuration
 * Centralized settings for animations, caching, and resource management
 */

export const PERFORMANCE_CONFIG = {
  // Animation settings
  animation: {
    // Spring animation configs
    spring: {
      default: { tension: 300, friction: 28 },
      fast: { tension: 320, friction: 24 },
      slow: { tension: 260, friction: 32 },
      smooth: { tension: 200, friction: 30 },
    },
    // Transition durations
    transition: {
      fast: 200,
      normal: 300,
      slow: 500,
    },
  },

  // Cache settings
  cache: {
    // Color extraction cache
    colorExtraction: {
      maxSize: 50,
      ttl: 10 * 60 * 1000, // 10 minutes
    },
    // Lyrics cache
    lyrics: {
      maxSize: 100,
      ttl: 30 * 60 * 1000, // 30 minutes
    },
    // Image cache
    image: {
      maxSize: 200,
      ttl: 60 * 60 * 1000, // 1 hour
    },
  },

  // Debounce delays
  debounce: {
    search: 300,
    resize: 150,
    scroll: 100,
    input: 200,
  },

  // Throttle delays
  throttle: {
    scroll: 16, // ~60fps
    resize: 16,
    mousemove: 16,
  },

  // Virtual list settings
  virtualList: {
    overscan: 3, // Number of items to render outside viewport
    itemHeight: 64, // Default item height in pixels
  },

  // Background tasks
  background: {
    // Maximum concurrent background tasks
    maxConcurrent: 3,
    // Delay before starting background tasks (ms)
    startDelay: 1000,
    // Maximum cache size for background buffering (MB)
    maxCacheSize: 100,
  },

  // Memory management
  memory: {
    // Maximum number of audio elements to keep in memory
    maxAudioElements: 5,
    // Maximum number of canvas contexts
    maxCanvasContexts: 10,
    // Cleanup interval (ms)
    cleanupInterval: 5 * 60 * 1000, // 5 minutes
  },

  // Event listener optimization
  events: {
    // Use passive listeners for scroll/touch events
    usePassive: true,
    // Use capture phase for click outside detection
    useCapture: true,
  },
} as const;

/**
 * Get animation config by name
 */
export const getAnimationConfig = (name: keyof typeof PERFORMANCE_CONFIG.animation.spring) => {
  return PERFORMANCE_CONFIG.animation.spring[name];
};

/**
 * Get cache config by type
 */
export const getCacheConfig = (type: keyof typeof PERFORMANCE_CONFIG.cache) => {
  return PERFORMANCE_CONFIG.cache[type];
};

/**
 * Check if device is low-end (for performance degradation)
 */
export const isLowEndDevice = (): boolean => {
  // Check for reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return true;
  }

  // Check for low memory
  if ('deviceMemory' in navigator && (navigator as any).deviceMemory < 4) {
    return true;
  }

  // Check for slow connection
  if ('connection' in navigator) {
    const conn = (navigator as any).connection;
    if (conn && (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g')) {
      return true;
    }
  }

  return false;
};

/**
 * Get optimized config for current device
 */
export const getOptimizedConfig = () => {
  const isLowEnd = isLowEndDevice();

  return {
    ...PERFORMANCE_CONFIG,
    animation: {
      ...PERFORMANCE_CONFIG.animation,
      // Reduce animation complexity on low-end devices
      spring: isLowEnd
        ? {
            default: { tension: 200, friction: 20 },
            fast: { tension: 220, friction: 18 },
            slow: { tension: 180, friction: 22 },
            smooth: { tension: 150, friction: 25 },
          }
        : PERFORMANCE_CONFIG.animation.spring,
    },
    cache: {
      ...PERFORMANCE_CONFIG.cache,
      // Reduce cache size on low-end devices
      colorExtraction: {
        ...PERFORMANCE_CONFIG.cache.colorExtraction,
        maxSize: isLowEnd ? 20 : 50,
      },
      lyrics: {
        ...PERFORMANCE_CONFIG.cache.lyrics,
        maxSize: isLowEnd ? 50 : 100,
      },
      image: {
        ...PERFORMANCE_CONFIG.cache.image,
        maxSize: isLowEnd ? 100 : 200,
      },
    },
    virtualList: {
      ...PERFORMANCE_CONFIG.virtualList,
      // Reduce overscan on low-end devices
      overscan: isLowEnd ? 1 : 3,
    },
  };
};
