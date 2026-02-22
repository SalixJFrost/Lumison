import { useEffect, useRef, useCallback, useState } from 'react';
import {
  performanceMonitor,
  MemoryManager,
  AudioPerformanceOptimizer,
  RenderOptimizer,
  NetworkOptimizer,
} from '../utils/performanceMonitor';
import { PERFORMANCE_CONFIG } from '../config/performance';

interface PerformanceState {
  fps: number;
  memoryUsage: number;
  isLowPerformance: boolean;
  connectionQuality: 'fast' | 'medium' | 'slow' | 'offline';
  shouldReduceEffects: boolean;
}

/**
 * Hook for automatic performance optimization
 */
export const usePerformanceOptimization = () => {
  const [perfState, setPerfState] = useState<PerformanceState>({
    fps: 60,
    memoryUsage: 0,
    isLowPerformance: false,
    connectionQuality: 'medium',
    shouldReduceEffects: false,
  });

  useEffect(() => {
    // Start performance monitoring
    performanceMonitor.start();

    // Subscribe to performance updates
    const unsubscribe = performanceMonitor.subscribe((metrics) => {
      const isLowPerf = performanceMonitor.isLowPerformance();
      const connectionQuality = NetworkOptimizer.getConnectionQuality();
      const shouldReduce = isLowPerf || RenderOptimizer.prefersReducedMotion();

      setPerfState({
        fps: metrics.fps,
        memoryUsage: metrics.memoryUsage,
        isLowPerformance: isLowPerf,
        connectionQuality,
        shouldReduceEffects: shouldReduce,
      });
    });

    // Periodic memory cleanup
    const cleanupInterval = setInterval(() => {
      if (PERFORMANCE_CONFIG.memory.enableGCHints) {
        MemoryManager.requestGC();
      }
    }, PERFORMANCE_CONFIG.memory.cleanupInterval);

    return () => {
      unsubscribe();
      clearInterval(cleanupInterval);
      performanceMonitor.stop();
    };
  }, []);

  return perfState;
};

/**
 * Hook for optimized audio element management
 */
export const useOptimizedAudio = (audioRef: React.RefObject<HTMLAudioElement>) => {
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Register and optimize audio element
    AudioPerformanceOptimizer.registerAudioElement(audio);
    AudioPerformanceOptimizer.optimizeAudioElement(audio);

    return () => {
      AudioPerformanceOptimizer.unregisterAudioElement(audio);
    };
  }, [audioRef]);

  const getAudioLatency = useCallback(() => {
    return AudioPerformanceOptimizer.getAudioLatency();
  }, []);

  return { getAudioLatency };
};

/**
 * Hook for batched state updates
 */
export const useBatchedUpdate = <T,>(initialValue: T) => {
  const [value, setValue] = useState(initialValue);
  const pendingValueRef = useRef<T>(initialValue);
  const updateKeyRef = useRef(0);

  const setBatchedValue = useCallback((newValue: T | ((prev: T) => T)) => {
    const nextValue = typeof newValue === 'function' 
      ? (newValue as (prev: T) => T)(pendingValueRef.current)
      : newValue;
    
    pendingValueRef.current = nextValue;
    const key = `batched-update-${updateKeyRef.current++}`;

    RenderOptimizer.batchUpdate(key, () => {
      setValue(pendingValueRef.current);
    });
  }, []);

  return [value, setBatchedValue] as const;
};

/**
 * Hook for deferred non-critical updates
 */
export const useDeferredUpdate = <T,>(value: T, timeout = 1000): T => {
  const [deferredValue, setDeferredValue] = useState(value);

  useEffect(() => {
    RenderOptimizer.deferToIdle(() => {
      setDeferredValue(value);
    }, timeout);
  }, [value, timeout]);

  return deferredValue;
};

/**
 * Hook for hardware acceleration management
 */
export const useHardwareAcceleration = (
  ref: React.RefObject<HTMLElement>,
  enabled: boolean = true
) => {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (enabled && PERFORMANCE_CONFIG.rendering.enableHardwareAcceleration) {
      RenderOptimizer.enableHardwareAcceleration(element);
    } else {
      RenderOptimizer.disableHardwareAcceleration(element);
    }

    return () => {
      if (element) {
        RenderOptimizer.disableHardwareAcceleration(element);
      }
    };
  }, [ref, enabled]);
};

/**
 * Hook for adaptive quality based on performance
 */
export const useAdaptiveQuality = () => {
  const perfState = usePerformanceOptimization();
  
  const getQualitySettings = useCallback(() => {
    if (perfState.isLowPerformance) {
      return {
        enableBlur: false,
        enableGlow: false,
        enableShadow: true,
        animationQuality: 'low' as const,
        maxParticles: 20,
        targetFPS: 30,
      };
    }

    if (perfState.fps < 45) {
      return {
        enableBlur: false,
        enableGlow: true,
        enableShadow: true,
        animationQuality: 'medium' as const,
        maxParticles: 50,
        targetFPS: 45,
      };
    }

    return {
      enableBlur: true,
      enableGlow: true,
      enableShadow: true,
      animationQuality: 'high' as const,
      maxParticles: 100,
      targetFPS: 60,
    };
  }, [perfState]);

  return {
    ...perfState,
    qualitySettings: getQualitySettings(),
  };
};

/**
 * Hook for memory-efficient caching
 */
export const useMemoryCache = <T,>(
  cacheName: string,
  key: string,
  factory: () => T,
  maxSize?: number
): T => {
  const cache = MemoryManager.getCache<string, T>(cacheName, maxSize);
  
  if (cache.has(key)) {
    return cache.get(key)!;
  }

  const value = factory();
  MemoryManager.setCacheItem(cacheName, key, value, maxSize);
  return value;
};

/**
 * Hook for network-aware loading
 */
export const useNetworkAwareLoading = () => {
  const [connectionQuality, setConnectionQuality] = useState(
    NetworkOptimizer.getConnectionQuality()
  );
  const [isDataSaver, setIsDataSaver] = useState(
    NetworkOptimizer.isDataSaverEnabled()
  );

  useEffect(() => {
    const updateConnection = () => {
      setConnectionQuality(NetworkOptimizer.getConnectionQuality());
      setIsDataSaver(NetworkOptimizer.isDataSaverEnabled());
    };

    // Listen for connection changes
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);

    if ('connection' in navigator) {
      (navigator as any).connection?.addEventListener('change', updateConnection);
    }

    return () => {
      window.removeEventListener('online', updateConnection);
      window.removeEventListener('offline', updateConnection);
      if ('connection' in navigator) {
        (navigator as any).connection?.removeEventListener('change', updateConnection);
      }
    };
  }, []);

  const getBufferSize = useCallback(() => {
    return NetworkOptimizer.getRecommendedBufferSize();
  }, []);

  const shouldPreload = useCallback(() => {
    return connectionQuality === 'fast' && !isDataSaver;
  }, [connectionQuality, isDataSaver]);

  return {
    connectionQuality,
    isDataSaver,
    getBufferSize,
    shouldPreload,
  };
};
