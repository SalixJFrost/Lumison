import { useEffect, useRef, useCallback } from 'react';

interface AudioTransitionOptions {
  enabled: boolean;
  fadeInDuration?: number;
  fadeOutDuration?: number;
  crossfadeDuration?: number;
}

/**
 * Hook for audio fade in/out and crossfade transitions
 */
export const useAudioTransition = (
  audioRef: React.RefObject<HTMLAudioElement>,
  options: AudioTransitionOptions
) => {
  const {
    enabled,
    fadeInDuration = 1000,
    fadeOutDuration = 1000,
    crossfadeDuration = 2000,
  } = options;

  const fadeIntervalRef = useRef<number | null>(null);
  const targetVolumeRef = useRef<number>(1);
  const isFadingRef = useRef<boolean>(false);

  /**
   * Clear any ongoing fade
   */
  const clearFade = useCallback(() => {
    if (fadeIntervalRef.current) {
      cancelAnimationFrame(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
    isFadingRef.current = false;
  }, []);

  /**
   * Fade volume from current to target
   */
  const fadeVolume = useCallback(
    (targetVolume: number, duration: number, onComplete?: () => void) => {
      if (!audioRef.current || !enabled) {
        onComplete?.();
        return;
      }

      clearFade();
      isFadingRef.current = true;

      const audio = audioRef.current;
      const startVolume = audio.volume;
      const volumeDelta = targetVolume - startVolume;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        if (!audio || !isFadingRef.current) {
          onComplete?.();
          return;
        }

        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic for smoother fade
        const eased = 1 - Math.pow(1 - progress, 3);
        audio.volume = Math.max(0, Math.min(1, startVolume + volumeDelta * eased));

        if (progress < 1) {
          fadeIntervalRef.current = requestAnimationFrame(animate);
        } else {
          clearFade();
          onComplete?.();
        }
      };

      fadeIntervalRef.current = requestAnimationFrame(animate);
    },
    [audioRef, enabled, clearFade]
  );

  /**
   * Fade in audio
   */
  const fadeIn = useCallback(
    (targetVolume: number = 1) => {
      if (!audioRef.current || !enabled) return;

      const audio = audioRef.current;
      audio.volume = 0;
      targetVolumeRef.current = targetVolume;

      fadeVolume(targetVolume, fadeInDuration);
    },
    [audioRef, enabled, fadeVolume, fadeInDuration]
  );

  /**
   * Fade out audio
   */
  const fadeOut = useCallback(
    (onComplete?: () => void) => {
      if (!audioRef.current || !enabled) {
        onComplete?.();
        return;
      }

      fadeVolume(0, fadeOutDuration, onComplete);
    },
    [audioRef, enabled, fadeVolume, fadeOutDuration]
  );

  /**
   * Update target volume (for external volume changes)
   */
  const setTargetVolume = useCallback((volume: number) => {
    targetVolumeRef.current = volume;
  }, []);

  /**
   * Get current target volume
   */
  const getTargetVolume = useCallback(() => {
    return targetVolumeRef.current;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearFade();
    };
  }, [clearFade]);

  return {
    fadeIn,
    fadeOut,
    fadeVolume,
    setTargetVolume,
    getTargetVolume,
    clearFade,
    isFading: () => isFadingRef.current,
  };
};

/**
 * Hook for gapless playback (seamless transitions)
 */
export const useGaplessPlayback = (
  audioRef: React.RefObject<HTMLAudioElement>,
  enabled: boolean
) => {
  const nextAudioRef = useRef<HTMLAudioElement | null>(null);
  const isPreloadingRef = useRef<boolean>(false);

  /**
   * Preload next track for gapless playback
   */
  const preloadNextTrack = useCallback(
    (nextSrc: string) => {
      if (!enabled || isPreloadingRef.current) return;

      // Clean up previous preload
      if (nextAudioRef.current) {
        nextAudioRef.current.pause();
        nextAudioRef.current.src = '';
        nextAudioRef.current = null;
      }

      // Create new audio element for preloading
      const nextAudio = new Audio();
      nextAudio.preload = 'auto';
      nextAudio.src = nextSrc;
      nextAudio.volume = 0; // Silent preload
      
      // Start loading
      nextAudio.load();
      
      nextAudioRef.current = nextAudio;
      isPreloadingRef.current = true;

      // Mark as loaded when ready
      nextAudio.addEventListener('canplaythrough', () => {
        isPreloadingRef.current = false;
      }, { once: true });
    },
    [enabled]
  );

  /**
   * Switch to preloaded track
   */
  const switchToPreloadedTrack = useCallback(() => {
    if (!audioRef.current || !nextAudioRef.current) return false;

    const currentAudio = audioRef.current;
    const nextAudio = nextAudioRef.current;

    // Swap audio elements
    const currentSrc = currentAudio.src;
    const currentTime = currentAudio.currentTime;
    const currentVolume = currentAudio.volume;

    // Set next audio properties
    nextAudio.volume = currentVolume;
    
    // Update main audio element
    currentAudio.src = nextAudio.src;
    currentAudio.load();
    currentAudio.play().catch(err => console.error('Gapless playback failed:', err));

    // Clean up
    nextAudioRef.current = null;
    isPreloadingRef.current = false;

    return true;
  }, [audioRef]);

  /**
   * Cleanup preloaded track
   */
  const cleanupPreload = useCallback(() => {
    if (nextAudioRef.current) {
      nextAudioRef.current.pause();
      nextAudioRef.current.src = '';
      nextAudioRef.current = null;
    }
    isPreloadingRef.current = false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupPreload();
    };
  }, [cleanupPreload]);

  return {
    preloadNextTrack,
    switchToPreloadedTrack,
    cleanupPreload,
    isPreloading: () => isPreloadingRef.current,
  };
};
