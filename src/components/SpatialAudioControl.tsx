import React, { useEffect, useRef, useState } from 'react';
import { SpatialAudioEngine, PRESETS } from '../services/audio/SpatialAudioEngine';
import { useI18n } from '../contexts/I18nContext';

interface SpatialAudioControlProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
}

const SpatialAudioControl: React.FC<SpatialAudioControlProps> = ({
  audioRef,
  isPlaying,
}) => {
  const { t } = useI18n();
  const engineRef = useRef<SpatialAudioEngine | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  
  const [enabled, setEnabled] = useState(false);
  const [preset, setPreset] = useState<'music' | 'cinema' | 'vocal'>('music');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // EQ state
  const [eq, setEq] = useState({ sub: 0, bass: 0, mid: 0, highMid: 0, treble: 0 });
  
  // Spatial state
  const [spatial, setSpatial] = useState({
    width: 0.7,
    depth: 0.3,
    height: 0.5,
    roomSize: 0.4,
    distance: 0.5,
  });
  
  // Initialize engine
  useEffect(() => {
    if (!audioRef.current) return;
    
    const engine = new SpatialAudioEngine();
    engine.attachToAudioElement(audioRef.current);
    engine.applyPreset('music');
    engineRef.current = engine;
    
    // Resume audio context on user interaction
    const resumeContext = () => {
      engine.resume();
    };
    document.addEventListener('click', resumeContext, { once: true });
    
    return () => {
      engine.destroy();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioRef]);
  
  // Visualizer animation
  useEffect(() => {
    if (!engineRef.current || !canvasRef.current || !isPlaying) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const engine = engineRef.current;
    const analyzer = engine.getAnalyzer();
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      
      analyzer.getByteFrequencyData(dataArray);
      
      // Clear canvas
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Calculate average intensity
      const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
      const intensity = average / 255;
      
      // Animate spatial position based on intensity
      if (enabled) {
        engine.animateSpatialPosition(intensity);
      }
      
      // Draw frequency bars
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        
        // Color based on frequency (low=red, mid=green, high=blue)
        const hue = (i / bufferLength) * 240;
        ctx.fillStyle = `hsl(${hue}, 100%, ${50 + intensity * 30}%)`;
        
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
      
      // Draw 3D spatial indicator
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 30 + intensity * 50;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + intensity * 0.5})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw spatial position indicator
      const angle = Date.now() / 1000;
      const posX = centerX + Math.cos(angle) * radius * 0.7;
      const posY = centerY + Math.sin(angle) * radius * 0.7;
      
      ctx.beginPath();
      ctx.arc(posX, posY, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fill();
    };
    
    draw();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, enabled]);
  
  // Toggle spatial audio
  const handleToggle = () => {
    if (!engineRef.current) return;
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    engineRef.current.setEnabled(newEnabled);
  };
  
  // Change preset
  const handlePresetChange = (newPreset: 'music' | 'cinema' | 'vocal') => {
    if (!engineRef.current) return;
    setPreset(newPreset);
    engineRef.current.applyPreset(newPreset);
    
    // Update local state from preset
    const presetConfig = PRESETS[newPreset];
    if (presetConfig.eq) {
      setEq({ ...eq, ...presetConfig.eq });
    }
    if (presetConfig.spatial) {
      setSpatial({ ...spatial, ...presetConfig.spatial });
    }
  };
  
  // Update EQ
  const handleEQChange = (band: keyof typeof eq, value: number) => {
    if (!engineRef.current) return;
    setEq({ ...eq, [band]: value });
    engineRef.current.setEQBand(band, value);
  };
  
  // Update spatial parameter
  const handleSpatialChange = (param: keyof typeof spatial, value: number) => {
    if (!engineRef.current) return;
    setSpatial({ ...spatial, [param]: value });
    engineRef.current.setSpatialParameter(param, value);
  };
  
  return (
    <div className="w-96 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold text-sm">3D Spatial Audio</h3>
            <p className="text-white/50 text-xs">Cinema-style immersion</p>
          </div>
          
          <button
            onClick={handleToggle}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              enabled
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            {enabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
      
      {/* Visualizer */}
      <div className="relative h-32 bg-black/20">
        <canvas
          ref={canvasRef}
          width={384}
          height={128}
          className="w-full h-full"
        />
        <div className="absolute top-2 left-2 text-white/40 text-xs font-mono">
          {enabled ? 'ACTIVE' : 'INACTIVE'}
        </div>
      </div>
      
      {/* Presets */}
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          {(['music', 'cinema', 'vocal'] as const).map((p) => (
            <button
              key={p}
              onClick={() => handlePresetChange(p)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                preset === p
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
        
        {/* Advanced toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full py-2 text-white/60 hover:text-white text-xs font-medium transition-colors flex items-center justify-center gap-2"
        >
          <span>Advanced Settings</span>
          <svg
            className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {/* Advanced controls */}
        {showAdvanced && (
          <div className="space-y-4 pt-2">
            {/* EQ Section */}
            <div className="space-y-2">
              <h4 className="text-white/70 text-xs font-semibold uppercase tracking-wider">
                5-Band Equalizer
              </h4>
              {Object.entries(eq).map(([band, value]) => (
                <div key={band} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60">{band}</span>
                    <span className="text-white/90 font-mono">{value > 0 ? '+' : ''}{value.toFixed(1)} dB</span>
                  </div>
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="0.5"
                    value={value}
                    onChange={(e) => handleEQChange(band as keyof typeof eq, parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                  />
                </div>
              ))}
            </div>
            
            {/* Spatial Section */}
            <div className="space-y-2">
              <h4 className="text-white/70 text-xs font-semibold uppercase tracking-wider">
                Spatial Parameters
              </h4>
              {Object.entries(spatial).map(([param, value]) => (
                <div key={param} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60 capitalize">{param}</span>
                    <span className="text-white/90 font-mono">{(value * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={value}
                    onChange={(e) => handleSpatialChange(param as keyof typeof spatial, parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-purple-500 [&::-webkit-slider-thumb]:to-pink-500"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpatialAudioControl;
