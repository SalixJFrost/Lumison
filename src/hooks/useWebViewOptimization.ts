import { useEffect } from 'react';
import { PERFORMANCE_CONFIG } from '../config/performance';

const HW_ACCEL_STYLE_ID = 'lumison-hw-accelerate-style';
const BACKDROP_STYLE_ID = 'lumison-backdrop-optimized-style';

/**
 * WebView performance optimization hook
 * Applies various optimizations to improve rendering performance in webview environments
 */
export const useWebViewOptimization = () => {
  useEffect(() => {
    // Apply CSS containment to improve rendering performance
    if (PERFORMANCE_CONFIG.rendering.useCSSContainment) {
      const previousContain = document.body.style.contain;
      document.body.style.contain = 'layout style paint';
      return () => {
        document.body.style.contain = previousContain;
      };
    }
  }, []);

  useEffect(() => {
    // Reduce unnecessary repaints
    if (PERFORMANCE_CONFIG.webview.limitLayerUpdates) {
      let style = document.getElementById(HW_ACCEL_STYLE_ID) as HTMLStyleElement | null;
      const created = !style;

      if (!style) {
        style = document.createElement('style');
        style.id = HW_ACCEL_STYLE_ID;
      }

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

      if (created) {
        document.head.appendChild(style);
      }

      return () => {
        if (created && style.parentNode) {
          style.parentNode.removeChild(style);
        }
      };
    }
  }, []);

  return {
    currentFPS: 60,
    isPerformanceGood: true,
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
      let style = document.getElementById(BACKDROP_STYLE_ID) as HTMLStyleElement | null;
      const created = !style;

      if (!style) {
        style = document.createElement('style');
        style.id = BACKDROP_STYLE_ID;
      }

      style.textContent = `
        .backdrop-blur-optimized {
          backdrop-filter: blur(10px) !important;
          -webkit-backdrop-filter: blur(10px) !important;
        }
      `;

      if (created) {
        document.head.appendChild(style);
      }

      return () => {
        if (created && style.parentNode) {
          style.parentNode.removeChild(style);
        }
      };
    }
  }, [enabled]);
};
