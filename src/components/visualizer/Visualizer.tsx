import React, { useEffect, useRef } from 'react';
import audioProcessorUrl from './AudioProcessor.ts?worker&url';

interface VisualizerProps {
    audioRef: React.RefObject<HTMLAudioElement>;
    isPlaying: boolean;
    spatialEngine?: { getAnalyzer: () => AnalyserNode } | null;
}

// Global map to store source nodes to prevent "MediaElementAudioSourceNode" double-connection errors
const sourceMap = new WeakMap<HTMLAudioElement, MediaElementAudioSourceNode>();
const contextMap = new WeakMap<HTMLAudioElement, AudioContext>();

const Visualizer: React.FC<VisualizerProps> = ({ audioRef, isPlaying, spatialEngine }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const workerRef = useRef<Worker | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Effect 1: Get Analyser from Spatial Engine
    useEffect(() => {
        if (!isPlaying || !spatialEngine) {
            analyserRef.current = null;
            return;
        }

        try {
            const analyser = spatialEngine.getAnalyzer();
            if (analyser) {
                analyser.fftSize = 2048;
                analyser.smoothingTimeConstant = 0.75;
                analyserRef.current = analyser;
            }
        } catch (e) {
            console.error("Visualizer: Failed to get analyser", e);
        }

        return () => {
            analyserRef.current = null;
        };
    }, [isPlaying, spatialEngine]);

    // Effect 2: Canvas Rendering
    useEffect(() => {
        if (!isPlaying || !analyserRef.current) {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            return;
        }

        const canvasEl = canvasRef.current;
        if (!canvasEl) return;

        const ctx = canvasEl.getContext('2d');
        if (!ctx) return;

        const analyser = analyserRef.current;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const barCount = 64;
        const bars = new Array(barCount).fill(0);

        const draw = () => {
            if (!isPlaying || !analyserRef.current) return;

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

            // Draw bars
            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < barCount; i++) {
                const barHeight = Math.min(bars[i], height);
                const x = i * barWidth;
                const y = height - barHeight;
                const radius = barWidth / 3;

                ctx.beginPath();
                ctx.roundRect(x + 1, y, barWidth - 2, barHeight, radius);
                ctx.fill();
            }

            animationFrameRef.current = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        };
    }, [isPlaying]);

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
