/**
 * Performance monitoring and optimization utilities for music player
 * Inspired by Spotify, Apple Music, and other high-performance audio apps
 */

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  audioLatency: number;
  renderTime: number;
  lastUpdate: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    fps: 60,
    memoryUsage: 0,
    renderTime: 0,
    audioLatency: 0,
    lastUpdate: Date.now(),
  };

  private frameCount = 0;
  private lastFrameTime = performance.now();
  private fpsUpdateInterval = 1000; // Update FPS every second
  private observers: Set<(metrics: PerformanceMetrics) => void> = new Set();
  private rafId: number | null = null;
  private isMonitoring = false;

  /**
   * Start monitoring performance
   */
  start() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this.measureFrame();
  }

  /**
   * Stop monitoring performance
   */
  stop() {
    this.isMonitoring = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Subscribe to performance metrics updates
   */
  subscribe(callback: (metrics: PerformanceMetrics) => void) {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Measure frame performance
   */
  private measureFrame = () => {
    if (!this.isMonitoring) return;

    const now = performance.now();
    this.frameCount++;

    // Update FPS
    const elapsed = now - this.lastFrameTime;
    if (elapsed >= this.fpsUpdateInterval) {
      this.metrics.fps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastFrameTime = now;

      // Update memory usage if available
      if ('memory' in performance && (performance as any).memory) {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage = Math.round(
          memory.usedJSHeapSize / memory.jsHeapSizeLimit * 100
        );
      }

      this.metrics.lastUpdate = Date.now();
      this.notifyObservers();
    }

    this.rafId = requestAnimationFrame(this.measureFrame);
  };

  /**
   * Notify all observers of metrics update
   */
  private notifyObservers() {
    this.observers.forEach(callback => callback(this.metrics));
  }

  /**
   * Check if device is struggling with performance
   */
  isLowPerformance(): boolean {
    return this.metrics.fps < 30 || this.metrics.memoryUsage > 85;
  }

  /**
   * Get performance recommendations
   */
  getRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.metrics.fps < 30) {
      recommendations.push('Reduce visual effects for better performance');
    }

    if (this.metrics.memoryUsage > 85) {
      recommendations.push('Clear cache or reduce playlist size');
    }

    if (this.metrics.audioLatency > 100) {
      recommendations.push('Audio latency detected, check system audio settings');
    }

    return recommendations;
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Memory management utilities
 */
export class MemoryManager {
  private static caches: Map<string, Map<string, any>> = new Map();
  private static maxCacheSize = 50;
  private static lastCleanup = Date.now();
  private static cleanupInterval = 2 * 60 * 1000; // 2 minutes

  /**
   * Create or get a cache with LRU eviction
   */
  static getCache<K extends string, V>(name: string, maxSize = this.maxCacheSize): Map<K, V> {
    if (!this.caches.has(name)) {
      this.caches.set(name, new Map());
    }
    return this.caches.get(name) as Map<K, V>;
  }

  /**
   * Set cache item with LRU eviction
   */
  static setCacheItem<V>(cacheName: string, key: string, value: V, maxSize = this.maxCacheSize) {
    const cache = this.getCache(cacheName, maxSize);
    
    // Remove oldest item if cache is full
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    cache.set(key, value);
    
    // Periodic cleanup
    this.maybeCleanup();
  }

  /**
   * Clear specific cache
   */
  static clearCache(name: string) {
    this.caches.get(name)?.clear();
  }

  /**
   * Clear all caches
   */
  static clearAllCaches() {
    this.caches.forEach(cache => cache.clear());
  }

  /**
   * Periodic cleanup of old caches
   */
  private static maybeCleanup() {
    const now = Date.now();
    if (now - this.lastCleanup > this.cleanupInterval) {
      this.lastCleanup = now;
      
      // Clear caches that are too large
      this.caches.forEach((cache, name) => {
        if (cache.size > this.maxCacheSize * 2) {
          console.warn(`Cache ${name} exceeded size limit, clearing...`);
          cache.clear();
        }
      });
      
      this.requestGC();
    }
  }

  /**
   * Force garbage collection hint (if available)
   */
  static requestGC() {
    // Modern browsers will handle GC automatically
    // This is just a hint by clearing references
    if (typeof window !== 'undefined' && 'gc' in window) {
      try {
        (window as any).gc();
      } catch (e) {
        // GC not available
      }
    }
  }

  /**
   * Get memory usage estimate
   */
  static getMemoryUsage(): { used: number; total: number; percentage: number } | null {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.jsHeapSizeLimit,
        percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
      };
    }
    return null;
  }

  /**
   * Check if memory pressure is high
   */
  static isMemoryPressureHigh(): boolean {
    const usage = this.getMemoryUsage();
    return usage ? usage.percentage > 80 : false;
  }

  /**
   * Optimize memory usage by clearing unnecessary caches
   */
  static optimizeMemory() {
    if (this.isMemoryPressureHigh()) {
      console.warn('High memory pressure detected, optimizing...');
      
      // Clear half of each cache
      this.caches.forEach((cache) => {
        const entries = Array.from(cache.entries());
        const keepCount = Math.floor(entries.length / 2);
        cache.clear();
        entries.slice(-keepCount).forEach(([key, value]) => {
          cache.set(key, value);
        });
      });
      
      this.requestGC();
    }
  }
}

/**
 * Audio-specific performance utilities
 */
export class AudioPerformanceOptimizer {
  private static audioContext: AudioContext | null = null;
  private static audioElements: Set<HTMLAudioElement> = new Set();
  private static maxAudioElements = 2; // Reduced from 3

  /**
   * Get or create shared AudioContext
   */
  static getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        latencyHint: 'interactive',
        sampleRate: 48000, // Standard high-quality sample rate
      });
    }
    return this.audioContext;
  }

  /**
   * Register audio element for management
   */
  static registerAudioElement(element: HTMLAudioElement) {
    this.audioElements.add(element);
    
    // Clean up old elements if we exceed the limit
    if (this.audioElements.size > this.maxAudioElements) {
      const oldest = this.audioElements.values().next().value;
      this.unregisterAudioElement(oldest);
    }
  }

  /**
   * Unregister and clean up audio element
   */
  static unregisterAudioElement(element: HTMLAudioElement) {
    element.pause();
    element.src = '';
    element.load();
    this.audioElements.delete(element);
  }

  /**
   * Clean up all audio elements
   */
  static cleanup() {
    this.audioElements.forEach(element => {
      element.pause();
      element.src = '';
      element.load();
    });
    this.audioElements.clear();
    
    // Close audio context if not in use
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }

  /**
   * Optimize audio element settings
   */
  static optimizeAudioElement(element: HTMLAudioElement) {
    // Set optimal preload strategy based on connection
    const connectionQuality = NetworkOptimizer.getConnectionQuality();
    element.preload = connectionQuality === 'fast' ? 'auto' : 'metadata';
    
    // Enable hardware acceleration hints
    element.setAttribute('playsinline', 'true');
    
    // Disable unnecessary features
    element.controls = false;
    
    // Set crossOrigin for CORS support
    if (!element.crossOrigin) {
      element.crossOrigin = 'anonymous';
    }
  }

  /**
   * Get audio latency estimate
   */
  static getAudioLatency(): number {
    if (this.audioContext) {
      return this.audioContext.baseLatency * 1000; // Convert to ms
    }
    return 0;
  }

  /**
   * Suspend audio context to save resources
   */
  static async suspendAudioContext() {
    if (this.audioContext && this.audioContext.state === 'running') {
      await this.audioContext.suspend();
    }
  }

  /**
   * Resume audio context
   */
  static async resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }
}

/**
 * Render performance utilities
 */
export class RenderOptimizer {
  private static pendingUpdates: Map<string, () => void> = new Map();
  private static rafId: number | null = null;

  /**
   * Batch multiple updates into a single frame
   */
  static batchUpdate(key: string, callback: () => void) {
    this.pendingUpdates.set(key, callback);
    
    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => {
        this.pendingUpdates.forEach(cb => cb());
        this.pendingUpdates.clear();
        this.rafId = null;
      });
    }
  }

  /**
   * Defer non-critical updates to idle time
   */
  static deferToIdle(callback: () => void, timeout = 1000) {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(callback, { timeout });
    } else {
      setTimeout(callback, 0);
    }
  }

  /**
   * Check if reduced motion is preferred
   */
  static prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Get optimal animation frame rate
   */
  static getOptimalFrameRate(): number {
    // Check if device supports high refresh rate
    if ('screen' in window && 'refreshRate' in (window.screen as any)) {
      return Math.min((window.screen as any).refreshRate || 60, 120);
    }
    return 60;
  }

  /**
   * Enable hardware acceleration for element
   */
  static enableHardwareAcceleration(element: HTMLElement) {
    element.style.transform = 'translateZ(0)';
    element.style.willChange = 'transform, opacity';
  }

  /**
   * Disable hardware acceleration for element
   */
  static disableHardwareAcceleration(element: HTMLElement) {
    element.style.transform = '';
    element.style.willChange = 'auto';
  }
}

/**
 * Network performance utilities
 */
export class NetworkOptimizer {
  /**
   * Check connection quality
   */
  static getConnectionQuality(): 'fast' | 'medium' | 'slow' | 'offline' {
    if (!navigator.onLine) return 'offline';
    
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      const effectiveType = conn?.effectiveType;
      
      if (effectiveType === '4g') return 'fast';
      if (effectiveType === '3g') return 'medium';
      if (effectiveType === '2g' || effectiveType === 'slow-2g') return 'slow';
    }
    
    return 'medium';
  }

  /**
   * Get recommended buffer size based on connection
   */
  static getRecommendedBufferSize(): number {
    const quality = this.getConnectionQuality();
    
    switch (quality) {
      case 'fast': return 15; // 15 seconds
      case 'medium': return 10; // 10 seconds
      case 'slow': return 5; // 5 seconds
      case 'offline': return 0;
    }
  }

  /**
   * Check if data saver mode is enabled
   */
  static isDataSaverEnabled(): boolean {
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      return conn?.saveData === true;
    }
    return false;
  }
}

// Auto-start performance monitoring in development
if (process.env.NODE_ENV === 'development') {
  performanceMonitor.start();
  
  // Log performance metrics every 5 seconds
  performanceMonitor.subscribe((metrics) => {
    console.log('[Performance]', {
      fps: metrics.fps,
      memory: `${metrics.memoryUsage}%`,
      recommendations: performanceMonitor.getRecommendations(),
    });
  });
}
