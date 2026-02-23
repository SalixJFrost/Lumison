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
  
  const lastUpdateRef = useRef<PerformanceState | null>(null);

  useEffect(() => {
    // Start performance monitoring
    performanceMonitor.start();

    // Subscribe to performance updates
    const unsubscribe = performanceMonitor.subscribe((metrics) => {
      const isLowPerf = performanceMonitor.isLowPerformance();
      const connectionQuality = NetworkOptimizer.getConnectionQuality();
      const shouldReduce = isLowPerf || RenderOptimizer.prefersReducedMotion();

      const newState = {
        fps: metrics.fps,
        memoryUsage: metrics.memoryUsage,
        isLowPerformance: isLowPerf,
        connectionQuality,
        shouldReduceEffects: shouldReduce,
      };
      
      // 只在状态真正改变时才更新
      if (!lastUpdateRef.current || 
          lastUpdateRef.current.fps !== newState.fps ||
          lastUpdateRef.current.memoryUsage !== newState.memoryUsage ||
          lastUpdateRef.current.isLowPerformance !== newState.isLowPerformance ||
          lastUpdateRef.current.connectionQuality !== newState.connectionQuality ||
          lastUpdateRef.current.shouldReduceEffects !== newState.shouldReduceEffects) {
        lastUpdateRef.current = newState;
        setPerfState(newState);
      }
    });

    // Periodic memory cleanup - 增加清理间隔
    const cleanupInterval = setInterval(() => {
      if (PERFORMANCE_CONFIG.memory.enableGCHints) {
        MemoryManager.requestGC();
      }
    }, PERFORMANCE_CONFIG.memory.cleanupInterval * 2); // 加倍清理间隔

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
