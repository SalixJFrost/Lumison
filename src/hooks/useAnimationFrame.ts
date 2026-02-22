import { useEffect, useRef } from 'react';

/**
 * Optimized animation frame hook with automatic cleanup
 * Prevents memory leaks from requestAnimationFrame
 */
export const useAnimationFrame = (
  callback: (deltaTime: number) => void,
  enabled: boolean = true
) => {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();

  useEffect(() => {
    if (!enabled) return;

    const animate = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current;
        callback(deltaTime);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [callback, enabled]);
};
