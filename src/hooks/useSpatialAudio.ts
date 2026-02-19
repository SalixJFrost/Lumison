import { useEffect, useRef, useState } from 'react';
import { SpatialAudioEngine } from '../services/audio/SpatialAudioEngine';

export interface UseSpatialAudioOptions {
  enabled?: boolean;
  preset?: 'music' | 'cinema' | 'vocal';
}

export const useSpatialAudio = (
  audioRef: React.RefObject<HTMLAudioElement>,
  options: UseSpatialAudioOptions = {}
) => {
  const engineRef = useRef<SpatialAudioEngine | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [enabled, setEnabled] = useState(options.enabled ?? false);
  
  // Initialize engine
  useEffect(() => {
    if (!audioRef.current) return;
    
    const engine = new SpatialAudioEngine();
    engine.attachToAudioElement(audioRef.current);
    
    if (options.preset) {
      engine.applyPreset(options.preset);
    }
    
    engine.setEnabled(enabled);
    engineRef.current = engine;
    setIsReady(true);
    
    // Resume audio context on user interaction
    const resumeContext = () => {
      engine.resume();
    };
    document.addEventListener('click', resumeContext, { once: true });
    
    return () => {
      engine.destroy();
      engineRef.current = null;
      setIsReady(false);
    };
  }, [audioRef]);
  
  // Update enabled state
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setEnabled(enabled);
    }
  }, [enabled]);
  
  const toggleEnabled = () => {
    setEnabled(!enabled);
  };
  
  const applyPreset = (preset: 'music' | 'cinema' | 'vocal') => {
    if (engineRef.current) {
      engineRef.current.applyPreset(preset);
    }
  };
  
  const setEQBand = (band: 'sub' | 'bass' | 'mid' | 'highMid' | 'treble', value: number) => {
    if (engineRef.current) {
      engineRef.current.setEQBand(band, value);
    }
  };
  
  const setSpatialParameter = (
    param: 'width' | 'depth' | 'height' | 'roomSize' | 'distance',
    value: number
  ) => {
    if (engineRef.current) {
      engineRef.current.setSpatialParameter(param, value);
    }
  };
  
  const getAnalyzer = () => {
    return engineRef.current?.getAnalyzer() ?? null;
  };
  
  const getFrequencyData = () => {
    return engineRef.current?.getFrequencyData() ?? new Uint8Array(0);
  };
  
  return {
    isReady,
    enabled,
    toggleEnabled,
    applyPreset,
    setEQBand,
    setSpatialParameter,
    getAnalyzer,
    getFrequencyData,
    engine: engineRef.current,
  };
};
