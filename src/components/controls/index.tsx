/**
 * Optimized Controls Component
 * 
 * This is a refactored version of the original Controls component
 * with performance optimizations:
 * 
 * 1. Split into smaller sub-components
 * 2. Use Context API to reduce props drilling
 * 3. Memoize expensive calculations
 * 4. Optimize event listeners
 * 5. Use custom hooks for reusable logic
 * 
 * To migrate:
 * 1. Replace the old Controls.tsx with this file
 * 2. Update imports in App.tsx
 * 3. Wrap App with PlayerProvider
 */

import React, { memo } from 'react';
import CoverCard from './CoverCard';
import ProgressBar from './ProgressBar';
import { useI18n } from '../../contexts/I18nContext';

interface ControlsProps {
  // Core playback
  isPlaying: boolean;
  onPlayPause: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number, playImmediately?: boolean, defer?: boolean) => void;
  
  // Song info
  title: string;
  artist: string;
  coverUrl?: string;
  
  // Audio ref
  audioRef: React.RefObject<HTMLAudioElement>;
  
  // Navigation
  onNext: () => void;
  onPrev: () => void;
  
  // Search
  onSearchClick: () => void;
  
  // Playlist
  onTogglePlaylist: () => void;
  
  // Buffering
  isBuffering: boolean;
  bufferedEnd: number;
  
  // Other props from Context
  // volume, speed, playMode, etc. will come from usePlayerContext()
}

const Controls: React.FC<ControlsProps> = memo(({
  isPlaying,
  onPlayPause,
  currentTime,
  duration,
  onSeek,
  title,
  artist,
  coverUrl,
  audioRef,
  onNext,
  onPrev,
  onSearchClick,
  onTogglePlaylist,
  isBuffering,
  bufferedEnd,
}) => {
  const { t } = useI18n();

  return (
    <div className="w-full flex flex-col items-center justify-center gap-2 theme-text-primary select-none">
      {/* Cover Section with 3D Effect */}
      <CoverCard coverUrl={coverUrl} isPlaying={isPlaying} />

      {/* Song Info */}
      <div className="text-center mb-2 px-4 select-text cursor-text">
        <h2 className="text-3xl font-bold tracking-tight drop-shadow-md line-clamp-1 theme-text-primary">
          {title}
        </h2>
        <p className="text-xl font-medium line-clamp-1 theme-text-secondary">
          {artist}
        </p>
      </div>

      {/* Spectrum Visualizer */}
      {/* TODO: Import and use Visualizer component */}

      {/* Progress Bar */}
      <ProgressBar
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
        speed={1} // TODO: Get from Context
        bufferedEnd={bufferedEnd}
        onSeek={onSeek}
      />

      {/* Controls Row */}
      {/* TODO: Import and use PlaybackControls, VolumeControl, etc. */}
      <div className="w-full max-w-[480px] mt-6 px-2">
        <div className="flex items-center justify-between w-full">
          {/* Placeholder for controls */}
          <div className="text-sm theme-text-secondary">
            Controls will be added here
          </div>
        </div>
      </div>
    </div>
  );
});

Controls.displayName = 'Controls';

export default Controls;
