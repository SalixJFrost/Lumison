import React, { useEffect, useRef } from 'react';

interface WebGLVisualizerProps {
    audioRef: React.RefObject<HTMLAudioElement>;
    isPlaying: boolean;
    spatialEngine?: { getAnalyzer: () => AnalyserNode } | null;
    accentColor?: string;
    side?: 'left' | 'right';
}

const WebGLVisualizer: React.FC<WebGLVisualizerProps> = ({ 
    isPlaying, 
    spatialEngine, 
    accentColor = '#ffffff',
    side = 'left'
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const glRef = useRef<WebGLRenderingContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const programRef = useRef<WebGLProgram | null>(null);
    const textureRef = useRef<WebGLTexture | null>(null);

    // 解析 accentColor 为 RGB
    const parseColor = (color: string): [number, number, number] => {
        const hex = color.replace('#', '');
        if (hex.length === 6) {
            return [
                parseInt(hex.substr(0, 2), 16) / 255,
                parseInt(hex.substr(2, 2), 16) / 255,
                parseInt(hex.substr(4, 2), 16) / 255
            ];
        }
        return [1, 1, 1];
    };

    // 设置分析器
    useEffect(() => {
        if (!isPlaying || !spatialEngine) {
            analyserRef.current = null;
            return;
        }

        try {
            const analyser = spatialEngine.getAnalyzer();
            if (analyser) {
                analyser.fftSize = 512;
                analyser.smoothingTimeConstant = 0.75;
                analyserRef.current = analyser;
                console.log('[WebGLVisualizer] Analyser setup complete');
            }
        } catch (e) {
            console.error("[WebGLVisualizer] Failed to setup analyser:", e);
        }

        return () => {
            analyserRef.current = null;
        };
    }, [isPlaying, spatialEngine]);

    // 初始化 WebGL
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext('webgl');
        if (!gl) {
            console.error('[WebGLVisualizer] WebGL not supported');
            return;
        }
        glRef.current = gl;
        console.log('[WebGLVisualizer] WebGL context created');

        // Vertex Shader
        const vertexShaderSrc = `
            attribute vec2 position;
            varying vec2 vUv;
            void main() {
                vUv = position * 0.5 + 0.5;
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `;

        // Fragment Shader - 细条状波形（稀疏）
        const fragmentShaderSrc = `
            precision mediump float;
            varying vec2 vUv;
            uniform sampler2D uFFT;
            uniform float uTime;
            uniform vec3 uAccentColor;
            uniform vec2 uResolution;
            uniform float uSide;

            void main() {
                vec2 uv = vUv;
                
                // 条数（稀疏）
                float barCount = 32.0;
                
                // 当前条的索引
                float barIndex = floor(uv.x * barCount);
                
                // 条的中心位置
                float barCenter = (barIndex + 0.5) / barCount;
                
                // 条的宽度（细条）
                float barWidth = 0.6 / barCount;
                
                // 到条中心的距离
                float distToBar = abs(uv.x - barCenter);
                
                // 是否在条内
                float inBar = step(distToBar, barWidth * 0.5);
                
                // 采样频谱数据
                float idx = barIndex / barCount;
                idx = idx * 0.5; // 只使用前 50% 的频谱
                float amp = texture2D(uFFT, vec2(idx, 0.0)).r;
                
                // 增强振幅
                amp = pow(amp, 0.5) * 2.5;
                
                // 条的高度（从中心向上下扩展）
                float centerY = 0.5;
                float barHeight = amp * 0.4;
                
                // 到中心线的距离
                float distToCenter = abs(uv.y - centerY);
                
                // 条的形状（矩形，带圆角）
                float bar = smoothstep(barHeight + 0.02, barHeight, distToCenter) * inBar;
                
                // 颜色
                vec3 col = uAccentColor * bar * 1.8;
                
                // 添加白色高光
                float highlight = smoothstep(barHeight * 0.5 + 0.01, barHeight * 0.5, distToCenter) * inBar;
                col += vec3(1.0) * highlight * 0.5;
                
                // 水平渐变
                float horizGrad = 1.0;
                if (uSide < 0.0) {
                    horizGrad = smoothstep(0.0, 0.2, uv.x) * smoothstep(1.0, 0.8, uv.x);
                } else {
                    horizGrad = smoothstep(0.0, 0.2, 1.0 - uv.x) * smoothstep(1.0, 0.8, 1.0 - uv.x);
                }
                col *= horizGrad;
                
                // 垂直边缘淡出
                float vertEdge = smoothstep(0.0, 0.05, uv.y) * smoothstep(1.0, 0.95, uv.y);
                col *= vertEdge;
                
                float alpha = bar * 0.8;
                gl_FragColor = vec4(col, alpha);
            }
        `;

        const createShader = (type: number, src: string) => {
            const shader = gl.createShader(type);
            if (!shader) return null;
            gl.shaderSource(shader, src);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error('[WebGLVisualizer] Shader compile error:', gl.getShaderInfoLog(shader));
                return null;
            }
            return shader;
        };

        const vs = createShader(gl.VERTEX_SHADER, vertexShaderSrc);
        const fs = createShader(gl.FRAGMENT_SHADER, fragmentShaderSrc);
        if (!vs || !fs) return;

        const program = gl.createProgram();
        if (!program) return;
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('[WebGLVisualizer] Program link error:', gl.getProgramInfoLog(program));
            return;
        }
        programRef.current = program;
        console.log('[WebGLVisualizer] Shader program created');

        // 全屏四边形
        const quadBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1
        ]), gl.STATIC_DRAW);

        const posLoc = gl.getAttribLocation(program, "position");
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        // 创建纹理
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 256, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        textureRef.current = tex;

        // 启用混合
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        console.log('[WebGLVisualizer] WebGL setup complete');

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (tex) gl.deleteTexture(tex);
            if (program) gl.deleteProgram(program);
        };
    }, []);

    // 渲染循环
    useEffect(() => {
        if (!isPlaying || !analyserRef.current || !glRef.current || !programRef.current) {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            return;
        }

        const gl = glRef.current;
        const program = programRef.current;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const analyser = analyserRef.current;
        const fftSize = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(fftSize);

        const uFFTLoc = gl.getUniformLocation(program, "uFFT");
        const uTimeLoc = gl.getUniformLocation(program, "uTime");
        const uAccentColorLoc = gl.getUniformLocation(program, "uAccentColor");
        const uResolutionLoc = gl.getUniformLocation(program, "uResolution");
        const uSideLoc = gl.getUniformLocation(program, "uSide");

        const accentRGB = parseColor(accentColor);

        console.log('[WebGLVisualizer] Starting render loop');

        const render = (time: number) => {
            if (!isPlaying || !analyserRef.current) return;

            // 设置 canvas 尺寸
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width;
                canvas.height = height;
                gl.viewport(0, 0, width, height);
            }

            // 获取频谱数据
            analyser.getByteFrequencyData(dataArray);

            // 调试：检查是否有音频数据
            const hasData = dataArray.some(v => v > 0);
            if (!hasData && Math.random() < 0.01) {
                console.log('[WebGLVisualizer] No audio data detected');
            }

            // 更新纹理
            if (textureRef.current) {
                gl.bindTexture(gl.TEXTURE_2D, textureRef.current);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, fftSize, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, dataArray);
            }

            // 清空画布
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            // 渲染
            gl.useProgram(program);
            gl.uniform1i(uFFTLoc, 0);
            gl.uniform1f(uTimeLoc, time * 0.001);
            gl.uniform3f(uAccentColorLoc, accentRGB[0], accentRGB[1], accentRGB[2]);
            gl.uniform2f(uResolutionLoc, width, height);
            gl.uniform1f(uSideLoc, side === 'left' ? -1.0 : 1.0);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, textureRef.current);

            gl.drawArrays(gl.TRIANGLES, 0, 6);

            animationFrameRef.current = requestAnimationFrame(render);
        };

        animationFrameRef.current = requestAnimationFrame(render);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        };
    }, [isPlaying, accentColor, side]);

    if (!isPlaying) return null;

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full"
        />
    );
};

export default WebGLVisualizer;

