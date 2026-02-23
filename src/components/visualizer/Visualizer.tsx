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
                analyser.fftSize = 2048;
                analyser.smoothingTimeConstant = 0.75;
                analyserRef.current = analyser;
                setHasAnalyser(true);
                console.log("[Visualizer] ✓ Analyser configured successfully");
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

        // Reduce bar count on low-end devices
        const deviceMemory = (navigator as any).deviceMemory || 4;
        const barCount = deviceMemory < 4 ? 32 : 64;
        const bars = new Array(barCount).fill(0);

        // Throttle rendering to 30fps on low-end devices
        const targetFPS = deviceMemory < 4 ? 30 : 60;
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
