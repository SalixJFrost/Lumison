/**
 * 内存优化配置
 * Memory Optimization Configuration
 */

export interface MemoryConfig {
  background: {
    enabled: boolean;
    layerCount: number;
    canvasScale: number;
    useMultiPass: boolean;
  };
  visualizer: {
    enabled: boolean;
    fftSize: number;
    barCount: number;
    targetFPS: number;
  };
  spatialAudio: {
    enabled: boolean;
    irQuality: 'low' | 'medium' | 'high';
  };
  cache: {
    maxImages: number;
    maxMemory: number; // bytes
  };
}

/**
 * 获取设备内存（GB）
 */
function getDeviceMemory(): number {
  return (navigator as any).deviceMemory || 4;
}

/**
 * 根据设备内存自动配置
 */
export const MEMORY_CONFIG = {
  /**
   * 获取最优配置
   */
  getOptimalConfig: (): MemoryConfig => {
    const deviceMemory = getDeviceMemory();
    
    // 低端设备 (< 4GB)
    if (deviceMemory < 4) {
      return {
        background: {
          enabled: true,
          layerCount: 1,
          canvasScale: 0.5,
          useMultiPass: false,
        },
        visualizer: {
          enabled: true,
          fftSize: 512,
          barCount: 16,
          targetFPS: 30,
        },
        spatialAudio: {
          enabled: false,
          irQuality: 'low',
        },
        cache: {
          maxImages: 5,
          maxMemory: 10 * 1024 * 1024, // 10MB
        },
      };
    }
    
    // 中端设备 (4-8GB)
    if (deviceMemory < 8) {
      return {
        background: {
          enabled: true,
          layerCount: 2,
          canvasScale: 0.75,
          useMultiPass: false,
        },
        visualizer: {
          enabled: true,
          fftSize: 1024,
          barCount: 32,
          targetFPS: 45,
        },
        spatialAudio: {
          enabled: true,
          irQuality: 'medium',
        },
        cache: {
          maxImages: 10,
          maxMemory: 20 * 1024 * 1024, // 20MB
        },
      };
    }
    
    // 高端设备 (>= 8GB)
    return {
      background: {
        enabled: true,
        layerCount: 3,
        canvasScale: 1.0,
        useMultiPass: true,
      },
      visualizer: {
        enabled: true,
        fftSize: 2048,
        barCount: 64,
        targetFPS: 60,
      },
      spatialAudio: {
        enabled: true,
        irQuality: 'high',
      },
      cache: {
        maxImages: 15,
        maxMemory: 30 * 1024 * 1024, // 30MB
      },
    };
  },

  /**
   * 获取 Canvas 最优尺寸
   */
  getOptimalCanvasSize: (): { width: number; height: number } => {
    const deviceMemory = getDeviceMemory();
    const dpr = window.devicePixelRatio;
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    if (deviceMemory < 4) {
      return { 
        width: width * 0.5, 
        height: height * 0.5 
      };
    } else if (deviceMemory < 8) {
      return { 
        width: width * 0.75, 
        height: height * 0.75 
      };
    }
    
    // 高端设备也限制最大分辨率
    const maxScale = Math.min(dpr, 2);
    return { 
      width: width * maxScale, 
      height: height * maxScale 
    };
  },

  /**
   * 检查是否应该启用某个功能
   */
  shouldEnable: (feature: keyof MemoryConfig): boolean => {
    const config = MEMORY_CONFIG.getOptimalConfig();
    return config[feature].enabled;
  },
};

/**
 * 内存监控 Hook
 */
export function getMemoryUsage(): number | null {
  if ('memory' in performance) {
    const mem = (performance as any).memory;
    return mem.usedJSHeapSize / 1024 / 1024; // MB
  }
  return null;
}

/**
 * 内存压力检测
 */
export function getMemoryPressure(): 'low' | 'medium' | 'high' {
  const memory = getMemoryUsage();
  if (!memory) return 'low';
  
  if (memory > 400) return 'high';
  if (memory > 300) return 'medium';
  return 'low';
}

/**
 * 自动降级建议
 */
export function getQualityRecommendation(): 'high' | 'medium' | 'low' {
  const pressure = getMemoryPressure();
  const deviceMemory = getDeviceMemory();
  
  if (pressure === 'high' || deviceMemory < 4) return 'low';
  if (pressure === 'medium' || deviceMemory < 8) return 'medium';
  return 'high';
}
