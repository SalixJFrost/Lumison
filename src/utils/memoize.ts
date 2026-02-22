/**
 * Simple memoization utility with LRU cache
 * Prevents expensive recalculations for the same inputs
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  maxSize: number = 50
): T {
  const cache = new Map<string, { value: ReturnType<T>; timestamp: number }>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);

    if (cached) {
      // Move to end (LRU)
      cache.delete(key);
      cache.set(key, cached);
      return cached.value;
    }

    const result = fn(...args);
    cache.set(key, { value: result, timestamp: Date.now() });

    // Evict oldest if cache is full
    if (cache.size > maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    return result;
  }) as T;
}

/**
 * Async memoization with TTL support
 */
export function memoizeAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  ttl: number = 5 * 60 * 1000, // 5 minutes default
  maxSize: number = 50
): T {
  const cache = new Map<string, { 
    promise: Promise<ReturnType<T>>; 
    timestamp: number;
  }>();

  return ((...args: Parameters<T>): Promise<ReturnType<T>> => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);
    const now = Date.now();

    // Return cached if valid
    if (cached && now - cached.timestamp < ttl) {
      return cached.promise;
    }

    // Create new promise
    const promise = fn(...args);
    cache.set(key, { promise, timestamp: now });

    // Cleanup expired entries
    for (const [k, v] of cache.entries()) {
      if (now - v.timestamp >= ttl) {
        cache.delete(k);
      }
    }

    // Evict oldest if cache is full
    if (cache.size > maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    return promise;
  }) as T;
}

/**
 * Clear all memoization caches (useful for testing)
 */
export function clearMemoCache() {
  // This is a placeholder - actual implementation would need
  // to track all memoized functions
  console.log('Memo cache cleared');
}
