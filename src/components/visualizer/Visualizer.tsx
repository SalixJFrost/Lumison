import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
    audioRef: React.RefObject<HTMLAudioElement>;
    isPlaying: boolean;
    spatialEngine?: { getAnalyzer: () => AnalyserNode } | null;
}

const Visualizer: React.FC<VisualizerProps> = ({ audioRef, isPlaying, spatialEngine }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const [hasAnalyser, setHasAnalyser] = React.useState(false);

    // Effect 1: Get Analyser from Spatial Engine
    useEffect(() => {
        console.log("[Visualizer] Effect 1 - isPlaying:", isPlaying, "spatialEngine:", !!spatialEngine);
        
        if (!isPlaying || !spatialEngine) {
            analyserRef.current = null;
            setHasAnalyser(false);
            return;
        }

        try {
            const analyser = spatialEngine.getAnalyzer();
            console.log("[Visualizer] Got analyser:", !!analyser);
            if (analyser) {
                // Optimize FFT size based on device memory
                const deviceMemory = (navigator as any).deviceMemory || 4;
                let fftSize: number;
                if (deviceMemory < 4) {
                    fftSize = 512; // Low-end devices
                } else if (deviceMemory < 8) {
                    fftSize = 1024; // Mid-range devices
                } else {
                    fftSize = 2048; // High-end devices
                }
                
                // Ensure fftSize is valid (power of 2)
                analyser.fftSize = fftSize;
                analyser.smoothingTimeConstant = 0.75;
                analyserRef.current = analyser;
                setHasAnalyser(true);
                console.log("[Visualizer] ✓ Analyser configured successfully with fftSize:", analyser.fftSize, "bufferLength:", analyser.frequencyBinCount);
            } else {
                console.warn("[Visualizer] Analyser is null or undefined");
            }
        } catch (e) {
            console.error("[Visualizer] Failed to get analyser:", e);
        }

        return () => {
            analyserRef.current = null;
            setHasAnalyser(false);
        };
    }, [isPlaying, spatialEngine]);

    // Effect 2: Canvas Rendering with optimizations
    useEffect(() => {
        console.log("[Visualizer] Effect 2 - isPlaying:", isPlaying, "hasAnalyser:", hasAnalyser);
        
        if (!isPlaying || !hasAnalyser || !analyserRef.current) {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            return;
        }

        const canvasEl = canvasRef.current;
        if (!canvasEl) {
            console.warn("[Visualizer] No canvas element");
            return;
        }

        const ctx = canvasEl.getContext('2d', { 
            alpha: true,
            desynchronized: true,
            willReadFrequently: false
        });
        if (!ctx) return;

        const analyser = analyserRef.current;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // Optimize bar count based on device memory for better performance
        const deviceMemory = (navigator as any).deviceMemory || 4;
        let barCount: number;
        if (deviceMemory < 4) {
            barCount = 24; // Low-end: fewer bars but still looks good
        } else if (deviceMemory < 8) {
            barCount = 40; // Mid-range: balanced
        } else {
            barCount = 64; // High-end: full quality
        }
        const bars = new Array(barCount).fill(0);

        // Optimize frame rate based on device
        const targetFPS = deviceMemory < 4 ? 30 : deviceMemory < 8 ? 45 : 60;
        const frameInterval = 1000 / targetFPS;
        let lastFrameTime = performance.now();

        const draw = (currentTime: number) => {
            if (!isPlaying || !analyserRef.current) {
                console.log("[Visualizer] Animation stopped");
                return;
            }

            // Throttle frame rate
            const elapsed = currentTime - lastFrameTime;
            if (elapsed < frameInterval) {
                animationFrameRef.current = requestAnimationFrame(draw);
                return;
            }
            lastFrameTime = currentTime - (elapsed % frameInterval);

            analyser.getByteFrequencyData(dataArray);

            const width = canvasEl.width;
            const height = canvasEl.height;

            ctx.clearRect(0, 0, width, height);

            const barWidth = width / barCount;
            const samplesPerBar = Math.floor(bufferLength / barCount);

            // Calculate target bar heights with increased sensitivity
            for (let i = 0; i < barCount; i++) {
                let sum = 0;
                for (let j = 0; j < samplesPerBar; j++) {
                    const index = i * samplesPerBar + j;
                    if (index < bufferLength) {
                        sum += dataArray[index];
                    }
                }
                const average = sum / samplesPerBar;
                // Increase jump height by amplifying the value (2.5x multiplier)
                const targetHeight = (average / 255) * height * 2.5;
                
                // Smooth animation with faster response
                bars[i] += (targetHeight - bars[i]) * 0.35;
            }

            // Batch draw operations for better performance
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            for (let i = 0; i < barCount; i++) {
                const barHeight = Math.min(bars[i], height);
                const x = i * barWidth;
                const y = height - barHeight;
                const radius = barWidth / 3;

                ctx.roundRect(x + 1, y, barWidth - 2, barHeight, radius);
            }
            ctx.fill();

            animationFrameRef.current = requestAnimationFrame(draw);
        };

        console.log("[Visualizer] Starting animation loop");
        animationFrameRef.current = requestAnimationFrame(draw);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        };
    }, [isPlaying, hasAnalyser]);

    if (!isPlaying) return <div className="h-8 w-full"></div>;

    // Show placeholder if no analyser available
    if (!hasAnalyser) {
        return (
            <div className="w-full max-w-[320px] h-8 flex items-center justify-center">
                <div className="text-xs text-white/30">
                    {spatialEngine ? 'Initializing visualizer...' : 'No audio engine'}
                </div>
            </div>
        );
    }

    return (
        <canvas
            ref={canvasRef}
            width={320}
            height={32}
            className="w-full max-w-[320px] h-8 transition-opacity duration-500"
        />
    );
};

export default Visualizer;
