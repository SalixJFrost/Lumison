import { useEffect, RefObject } from 'react';

/**
 * Hook to detect clicks outside of a referenced element
 * Optimized to prevent memory leaks and unnecessary re-renders
 */
export const useClickOutside = <T extends HTMLElement>(
  ref: RefObject<T>,
  handler: () => void,
  enabled: boolean = true
) => {
  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler();
      }
    };

    // Use capture phase for better performance
    document.addEventListener('mousedown', handleClickOutside, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [ref, handler, enabled]);
};
