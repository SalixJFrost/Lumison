import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { PlayMode } from '../types';

interface PlayerContextValue {
  // Playback state
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isBuffering: boolean;
  
  // Volume
  volume: number;
  setVolume: (volume: number) => void;
  
  // Speed
  speed: number;
  preservesPitch: boolean;
  setSpeed: (speed: number) => void;
  togglePreservesPitch: () => void;
  
  // Play mode
  playMode: PlayMode;
  togglePlayMode: () => void;
  
  // UI state
  showVolumePopup: boolean;
  setShowVolumePopup: (show: boolean) => void;
  showSettingsPopup: boolean;
  setShowSettingsPopup: (show: boolean) => void;
}

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

export const usePlayerContext = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayerContext must be used within PlayerProvider');
  }
  return context;
};

interface PlayerProviderProps {
  children: ReactNode;
  value: PlayerContextValue;
}

export const PlayerProvider: React.FC<PlayerProviderProps> = ({ children, value }) => {
  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};
