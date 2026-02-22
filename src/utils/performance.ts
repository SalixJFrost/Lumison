/**
 * Performance monitoring and testing utilities
 */

interface PerformanceMetrics {
  renderCount: number;
  renderDuration: number;
  memoryUsage?: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics[]> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();

  /**
   * Start monitoring a component
   */
  startMonitoring(componentName: string) {
    if (this.observers.has(componentName)) {
      console.warn(`Already monitoring ${componentName}`);
      return;
    }

    // Initialize metrics array
    if (!this.metrics.has(componentName)) {
      this.metrics.set(componentName, []);
    }

    // Create performance observer
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name.includes(componentName)) {
          this.recordMetric(componentName, {
            renderCount: 1,
            renderDuration: entry.duration,
            timestamp: entry.startTime,
          });
        }
      }
    });

    observer.observe({ entryTypes: ['measure'] });
    this.observers.set(componentName, observer);
  }

  /**
   * Stop monitoring a component
   */
  stopMonitoring(componentName: string) {
    const observer = this.observers.get(componentName);
    if (observer) {
      observer.disconnect();
      this.observers.delete(componentName);
    }
  }

  /**
   * Record a metric
   */
  private recordMetric(componentName: string, metric: PerformanceMetrics) {
    const metrics = this.metrics.get(componentName) || [];
    metrics.push(metric);

    // Keep only last 100 metrics
    if (metrics.length > 100) {
      metrics.shift();
    }

    this.metrics.set(componentName, metrics);
  }

  /**
   * Get metrics for a component
   */
  getMetrics(componentName: string): PerformanceMetrics[] {
    return this.metrics.get(componentName) || [];
  }

  /**
   * Get average render duration
   */
  getAverageRenderDuration(componentName: string): number {
    const metrics = this.getMetrics(componentName);
    if (metrics.length === 0) return 0;

    const total = metrics.reduce((sum, m) => sum + m.renderDuration, 0);
    return total / metrics.length;
  }

  /**
   * Get total render count
   */
  getTotalRenderCount(componentName: string): number {
    const metrics = this.getMetrics(componentName);
    return metrics.reduce((sum, m) => sum + m.renderCount, 0);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(componentName?: string) {
    if (componentName) {
      this.metrics.delete(componentName);
    } else {
      this.metrics.clear();
    }
  }

  /**
   * Get summary report
   */
  getSummary(): Record<string, { avgDuration: number; totalRenders: number }> {
    const summary: Record<string, { avgDuration: number; totalRenders: number }> = {};

    for (const [name, metrics] of this.metrics.entries()) {
      summary[name] = {
        avgDuration: this.getAverageRenderDuration(name),
        totalRenders: this.getTotalRenderCount(name),
      };
    }

    return summary;
  }

  /**
   * Print summary to console
   */
  printSummary() {
    const summary = this.getSummary();
    console.table(summary);
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Measure execution time of a function
 */
export function measureTime<T>(
  name: string,
  fn: () => T,
  logResult: boolean = true
): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  const duration = end - start;

  if (logResult) {
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
  }

  // Record in performance timeline
  performance.mark(`${name}-start`);
  performance.mark(`${name}-end`);
  performance.measure(name, `${name}-start`, `${name}-end`);

  return result;
}

/**
 * Measure async function execution time
 */
export async function measureTimeAsync<T>(
  name: string,
  fn: () => Promise<T>,
  logResult: boolean = true
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  const duration = end - start;

  if (logResult) {
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
  }

  performance.mark(`${name}-start`);
  performance.mark(`${name}-end`);
  performance.measure(name, `${name}-start`, `${name}-end`);

  return result;
}

/**
 * Get current memory usage (if available)
 */
export function getMemoryUsage(): number | undefined {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return memory.usedJSHeapSize / 1024 / 1024; // MB
  }
  return undefined;
}

/**
 * Log memory usage
 */
export function logMemoryUsage(label: string = 'Memory') {
  const usage = getMemoryUsage();
  if (usage !== undefined) {
    console.log(`[${label}] ${usage.toFixed(2)} MB`);
  }
}

/**
 * Detect performance issues
 */
export function detectPerformanceIssues(): {
  slowRenders: string[];
  frequentRenders: string[];
  memoryLeaks: string[];
} {
  const summary = performanceMonitor.getSummary();
  const issues = {
    slowRenders: [] as string[],
    frequentRenders: [] as string[],
    memoryLeaks: [] as string[],
  };

  for (const [name, metrics] of Object.entries(summary)) {
    // Slow renders (> 16ms for 60fps)
    if (metrics.avgDuration > 16) {
      issues.slowRenders.push(
        `${name}: ${metrics.avgDuration.toFixed(2)}ms avg`
      );
    }

    // Frequent renders (> 100 in monitoring period)
    if (metrics.totalRenders > 100) {
      issues.frequentRenders.push(
        `${name}: ${metrics.totalRenders} renders`
      );
    }
  }

  return issues;
}

/**
 * React component performance wrapper
 */
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
): React.ComponentType<P> {
  return (props: P) => {
    React.useEffect(() => {
      performanceMonitor.startMonitoring(componentName);
      return () => performanceMonitor.stopMonitoring(componentName);
    }, []);

    React.useEffect(() => {
      performance.mark(`${componentName}-render-start`);
      return () => {
        performance.mark(`${componentName}-render-end`);
        performance.measure(
          `${componentName}-render`,
          `${componentName}-render-start`,
          `${componentName}-render-end`
        );
      };
    });

    return React.createElement(Component, props);
  };
}

/**
 * Development-only performance logging
 */
export const devLog = {
  render: (componentName: string, props?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Render] ${componentName}`, props);
    }
  },
  
  effect: (componentName: string, effectName: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Effect] ${componentName}.${effectName}`);
    }
  },
  
  time: (label: string, duration: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Time] ${label}: ${duration.toFixed(2)}ms`);
    }
  },
};

// Export for global access in development
if (process.env.NODE_ENV === 'development') {
  (window as any).__performanceMonitor = performanceMonitor;
  (window as any).__detectPerformanceIssues = detectPerformanceIssues;
}
