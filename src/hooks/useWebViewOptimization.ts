import { useEffect, useRef } from 'react';
import { PERFORMANCE_CONFIG } from '../config/performance';

/**
 * WebView performance optimization hook
 * Applies various optimizations to improve rendering performance in webview environments
 */
export const useWebViewOptimization = () => {
  const rafIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const fpsRef = useRef<number>(60);

  useEffect(() => {
    // Monitor FPS and adjust quality dynamically
    const measureFPS = (timestamp: number) => {
      if (lastFrameTimeRef.current) {
        const delta = timestamp - lastFrameTimeRef.current;
        frameCountRef.current++;

        // Calculate FPS every second
        if (frameCountRef.current >= 60) {
          fpsRef.current = Math.round(1000 / (delta / frameCountRef.current));
          frameCountRef.current = 0;
        }
      }
      lastFrameTimeRef.current = timestamp;
      rafIdRef.current = requestAnimationFrame(measureFPS);
    };

    rafIdRef.current = requestAnimationFrame(measureFPS);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Apply CSS containment to improve rendering performance
    if (PERFORMANCE_CONFIG.rendering.useCSSContainment) {
      document.body.style.contain = 'layout style paint';
    }

    // Optimize scrolling performance
    if (PERFORMANCE_CONFIG.webview.usePassiveListeners) {
      const options = { passive: true };
      const handleScroll = () => {
        // Scroll handler with passive listener
      };
      window.addEventListener('scroll', handleScroll, options);
      window.addEventListener('touchmove', handleScroll, options);

      return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('touchmove', handleScroll);
      };
    }
  }, []);

  useEffect(() => {
    // Reduce unnecessary repaints
    if (PERFORMANCE_CONFIG.webview.limitLayerUpdates) {
      // Force GPU acceleration on key elements
      const style = document.createElement('style');
      style.textContent = `
        .hw-accelerate {
          transform: translateZ(0) !important;
          -webkit-transform: translateZ(0) !important;
          backface-visibility: hidden !important;
          -webkit-backface-visibility: hidden !important;
          perspective: 1000px !important;
          -webkit-perspective: 1000px !important;
        }
      `;
      document.head.appendChild(style);

      return () => {
        document.head.removeChild(style);
      };
    }
  }, []);

  return {
    currentFPS: fpsRef.current,
    isPerformanceGood: fpsRef.current >= 50,
  };
};

/**
 * Optimize backdrop filters for better performance
 */
export const useOptimizedBackdropFilter = (enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled || !PERFORMANCE_CONFIG.webview.limitBackdropFilters) return;

    // Reduce backdrop filter quality on low-end devices
    const isLowEnd = 'deviceMemory' in navigator && (navigator as any).deviceMemory < 4;
    
    if (isLowEnd) {
      const style = document.createElement('style');
      style.textContent = `
        .backdrop-blur-optimized {
          backdrop-filter: blur(10px) !important;
          -webkit-backdrop-filter: blur(10px) !important;
        }
      `;
      document.head.appendChild(style);

      return () => {
        document.head.removeChild(style);
      };
    }
  }, [enabled]);
};

/**
 * Batch DOM updates for better performance
 */
export const useBatchedUpdates = () => {
  const pendingUpdatesRef = useRef<Array<() => void>>([]);
  const rafIdRef = useRef<number | null>(null);

  const scheduleUpdate = (update: () => void) => {
    pendingUpdatesRef.current.push(update);

    if (!rafIdRef.current) {
      rafIdRef.current = requestAnimationFrame(() => {
        const updates = pendingUpdatesRef.current;
        pendingUpdatesRef.current = [];
        rafIdRef.current = null;

        // Execute all pending updates in a single frame
        updates.forEach(update => update());
      });
    }
  };

  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return { scheduleUpdate };
};
