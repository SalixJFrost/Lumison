import React, { useRef, memo, useState, useCallback, useMemo, useEffect } from 'react';
import { useSpring, animated, to } from '@react-spring/web';
import SmartImage from '../SmartImage';
import { useI18n } from '../../contexts/I18nContext';
import { PERFORMANCE_CONFIG } from '../../config/performance';
import { getDefaultCoverArt } from '../../services/coverArtService';
import { MoreVerticalIcon } from '../Icons';
import { useTheme } from '../../contexts/ThemeContext';

interface CoverCardProps {
  coverUrl?: string;
  isPlaying: boolean;
  showSettingsPopup?: boolean;
  setShowSettingsPopup?: (show: boolean) => void;
  settingsPopupContent?: React.ReactNode;
  title?: string;
  artist?: string;
}

const CoverCard: React.FC<CoverCardProps> = memo(({ 
  coverUrl, 
  isPlaying,
  showSettingsPopup = false,
  setShowSettingsPopup,
  settingsPopupContent,
  title = '',
  artist = '',
}) => {
  const { t } = useI18n();
  const { theme } = useTheme();
  const coverRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const rafIdRef = useRef<number | null>(null);
  const settingsContainerRef = useRef<HTMLDivElement>(null);
  
  // Use default cover art when no cover URL is provided
  const displayCover = coverUrl || getDefaultCoverArt();

  // Check if device supports 3D transforms efficiently
  const supports3D = useMemo(() => {
    const deviceMemory = (navigator as any).deviceMemory || 4;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return deviceMemory >= 4 && !prefersReducedMotion;
  }, []);

  // 3D Card Effect State - Only enable on capable devices
  const [{ rotateX, rotateY }, cardApi] = useSpring(() => ({
    rotateX: 0,
    rotateY: 0,
    config: { 
      tension: 280, 
      friction: 60,
      mass: 0.5,
    },
    immediate: !supports3D,
  }));

  const [coverSpring, coverApi] = useSpring(() => ({
    scale: isPlaying ? 1.04 : 0.94,
    config: PERFORMANCE_CONFIG.animation.spring.default,
  }));

  // Update scale when playing state changes - optimized
  React.useEffect(() => {
    coverApi.start({
      scale: isPlaying ? 1.04 : 0.94,
      config: PERFORMANCE_CONFIG.animation.spring.default,
    });
  }, [isPlaying, coverApi]);

  // Bounce effect on cover change - optimized with reduced duration
  React.useEffect(() => {
    if (!coverUrl) return;
    
    coverApi.start({ 
      scale: 0.96, 
      config: PERFORMANCE_CONFIG.animation.spring.fast,
    });
    
    const timeout = window.setTimeout(() => {
      coverApi.start({
        scale: isPlaying ? 1.04 : 0.94,
        config: PERFORMANCE_CONFIG.animation.spring.slow,
      });
    }, 150); // Reduced from 180ms
    
    return () => clearTimeout(timeout);
  }, [coverUrl, isPlaying, coverApi]);

  // 3D Card Mouse Move Handler - Optimized with RAF throttling and corner lift effect
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!coverRef.current || !supports3D) return;

    // Cancel previous RAF if still pending
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    // Throttle updates using RAF
    rafIdRef.current = requestAnimationFrame(() => {
      if (!coverRef.current) return;

      const rect = coverRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Calculate which corner is closest
      const isLeft = x < centerX;
      const isTop = y < centerY;
      
      // Create corner lift effect - corners lift up when mouse is near
      // The further from center, the more lift
      const distanceFromCenterX = Math.abs(x - centerX) / centerX;
      const distanceFromCenterY = Math.abs(y - centerY) / centerY;
      
      // Amplify the tilt for corner lift effect
      const liftMultiplier = 1.5;
      const rotateXValue = ((y - centerY) / centerY) * -15 * liftMultiplier;
      const rotateYValue = ((x - centerX) / centerX) * 15 * liftMultiplier;

      cardApi.start({
        rotateX: rotateXValue,
        rotateY: rotateYValue,
        config: { 
          tension: 300, 
          friction: 40,
          mass: 0.5,
        },
      });
    });
  }, [cardApi, supports3D]);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    
    // Cancel any pending RAF
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    if (supports3D) {
      cardApi.start({
        rotateX: 0,
        rotateY: 0,
        config: { 
          tension: 280, 
          friction: 60,
          mass: 0.5,
        },
      });
    }
  }, [cardApi, supports3D]);

  // Cleanup RAF on unmount
  React.useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // Mobile device orientation support
  useEffect(() => {
    if (!supports3D || typeof window === 'undefined') return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (!e.beta || !e.gamma) return;
      
      // beta: front-to-back tilt (-180 to 180)
      // gamma: left-to-right tilt (-90 to 90)
      const rotateXValue = (e.beta / 90) * 10; // Limit to ±10 degrees
      const rotateYValue = (e.gamma / 90) * 10;
      
      cardApi.start({
        rotateX: Math.max(-20, Math.min(20, rotateXValue)),
        rotateY: Math.max(-20, Math.min(20, rotateYValue)),
        config: { 
          tension: 280, 
          friction: 60,
          mass: 0.5,
        },
      });
    };

    // Request permission for iOS 13+
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      // iOS requires user interaction to enable
      // We'll skip auto-enabling on iOS for now
      return;
    } else {
      // Non-iOS devices
      window.addEventListener('deviceorientation', handleOrientation);
      return () => window.removeEventListener('deviceorientation', handleOrientation);
    }
  }, [supports3D, cardApi]);

  // Close settings popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsContainerRef.current &&
        !settingsContainerRef.current.contains(event.target as Node)
      ) {
        setShowSettingsPopup?.(false);
      }
    };
    if (showSettingsPopup) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showSettingsPopup, setShowSettingsPopup]);

  return (
    <div className="mb-6 w-full max-w-xl">
      <div
        ref={coverRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ perspective: supports3D ? '1500px' : 'none' }}
        className="hw-accelerate group"
      >
        <animated.div
          style={{
            transform: to(
              [coverSpring.scale, rotateX, rotateY],
              (scale, rx, ry) =>
                supports3D 
                  ? `scale(${scale}) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(50px)`
                  : `scale(${scale})`
            ),
            transformStyle: supports3D ? 'preserve-3d' : 'flat',
            willChange: 'transform',
          }}
          className="relative aspect-square w-64 md:w-72 lg:w-80 mx-auto rounded-3xl bg-gradient-to-br from-gray-800 to-gray-900 ring-1 ring-white/10 overflow-hidden hw-accelerate cover-card-optimized transition-all duration-300 group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.12),0_0_0_1px_rgba(255,255,255,0.05)]"
        >
          <SmartImage
            src={displayCover}
            alt="Album Art"
            containerClassName="absolute inset-0"
            imgClassName="w-full h-full object-cover"
            loading="eager"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
        </animated.div>
      </div>

      {/* Song Info and Actions Row - Below Cover */}
      <div className="w-64 md:w-72 lg:w-80 mx-auto mt-4 flex items-center justify-between gap-3">
        {/* Song Info - Center */}
        <div className="flex-1 min-w-0 text-left">
          <h3 className="text-base font-semibold tracking-tight truncate theme-text-primary">
            {title || t("player.noMusicLoaded")}
          </h3>
          <p className="text-sm font-medium truncate theme-text-secondary">
            {artist || ''}
          </p>
        </div>

        {/* Settings Menu Button */}
        {setShowSettingsPopup && (
          <div className="relative flex-shrink-0" ref={settingsContainerRef}>
            <button
              onClick={() => setShowSettingsPopup(!showSettingsPopup)}
              className={`p-2 rounded-full backdrop-blur-md transition-all duration-200 ${
                showSettingsPopup
                  ? theme === 'light' ? 'bg-black/10 text-black' : 'bg-white/10 text-white'
                  : theme === 'light' ? 'bg-black/5 text-black/60 hover:text-black hover:bg-black/10' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
              title={t("player.settings")}
            >
              <MoreVerticalIcon className="w-5 h-5" />
            </button>

            {/* Settings Popup */}
            {showSettingsPopup && settingsPopupContent}
          </div>
        )}
      </div>
    </div>
  );
});

CoverCard.displayName = 'CoverCard';

export default CoverCard;
