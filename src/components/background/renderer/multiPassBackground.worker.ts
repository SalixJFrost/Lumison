/**
 * 三层 WebGL Framebuffer 渲染管线 - Web Worker 实现
 * 架构：Pass 1 (Base) → Pass 2 (Swirl) → Pass 3 (Glow) → Final (Composite)
 */

import {
  vertexShaderSource,
  baseFlowFragmentShader,
  swirlLayerFragmentShader,
  glowLayerFragmentShader,
  streaksLayerFragmentShader,
  compositeFragmentShader,
} from './shaders';

const FRAME_INTERVAL = 1000 / 60; // 60 FPS

interface WorkerCommand {
  type: "init" | "resize" | "colors" | "play" | "pause" | "config";
  canvas?: OffscreenCanvas;
  width?: number;
  height?: number;
  colors?: string[];
  isPlaying?: boolean;
  paused?: boolean;
  config?: RenderConfig;
}

interface RenderConfig {
  swirlSpeed?: number;
  glowIntensity?: number;
  vignetteStrength?: number;
  glowResolution?: number; // 0.5 = half res
  swirlResolution?: number; // 0.75 = 3/4 res
  enableStreaks?: boolean; // 是否启用流光效果
}

interface Framebuffer {
  fbo: WebGLFramebuffer;
  texture: WebGLTexture;
  width: number;
  height: number;
}

let gl: WebGLRenderingContext | null = null;
let programs: {
  base: WebGLProgram | null;
  swirl: WebGLProgram | null;
  glow: WebGLProgram | null;
  streaks: WebGLProgram | null;
  composite: WebGLProgram | null;
} = { base: null, swirl: null, glow: null, streaks: null, composite: null };

let framebuffers: {
  base: Framebuffer | null;
  swirl: Framebuffer | null;
  glow: Framebuffer | null;
  streaks: Framebuffer | null;
} = { base: null, swirl: null, glow: null, streaks: null };

let positionBuffer: WebGLBuffer | null = null;
let timeAccumulator = 0;
let lastFrameTime = 0;
let lastRenderTime = 0;
let playing = true;
let paused = false;
let rafId: number | null = null;

// 默认配置
let config: Required<RenderConfig> = {
  swirlSpeed: 1.0,
  glowIntensity: 1.0,
  vignetteStrength: 0.8,
  glowResolution: 0.5,
  swirlResolution: 0.75,
  enableStreaks: true, // 默认启用流光
};

// 默认颜色（电影感配色）
let currentColors = [
  "rgb(8, 18, 25)",
  "rgb(25, 60, 70)",
  "rgb(90, 150, 140)",
  "rgb(180, 120, 90)",
];

const parseColor = (colorStr: string): [number, number, number] => {
  const match = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return [0, 0, 0];
  return [
    parseInt(match[1], 10) / 255,
    parseInt(match[2], 10) / 255,
    parseInt(match[3], 10) / 255,
  ];
};

const createShader = (
  glCtx: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader | null => {
  const shader = glCtx.createShader(type);
  if (!shader) return null;
  glCtx.shaderSource(shader, source);
  glCtx.compileShader(shader);
  if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
    console.error("Shader compile error:", glCtx.getShaderInfoLog(shader));
    glCtx.deleteShader(shader);
    return null;
  }
  return shader;
};

const createProgram = (
  glCtx: WebGLRenderingContext,
  vertSource: string,
  fragSource: string
): WebGLProgram | null => {
  const vertShader = createShader(glCtx, glCtx.VERTEX_SHADER, vertSource);
  const fragShader = createShader(glCtx, glCtx.FRAGMENT_SHADER, fragSource);
  if (!vertShader || !fragShader) return null;

  const program = glCtx.createProgram();
  if (!program) return null;

  glCtx.attachShader(program, vertShader);
  glCtx.attachShader(program, fragShader);
  glCtx.linkProgram(program);

  if (!glCtx.getProgramParameter(program, glCtx.LINK_STATUS)) {
    console.error("Program link error:", glCtx.getProgramInfoLog(program));
    glCtx.deleteProgram(program);
    return null;
  }

  return program;
};

const createFramebuffer = (
  glCtx: WebGLRenderingContext,
  width: number,
  height: number
): Framebuffer | null => {
  const fbo = glCtx.createFramebuffer();
  const texture = glCtx.createTexture();
  
  if (!fbo || !texture) return null;

  glCtx.bindTexture(glCtx.TEXTURE_2D, texture);
  glCtx.texImage2D(
    glCtx.TEXTURE_2D,
    0,
    glCtx.RGBA,
    width,
    height,
    0,
    glCtx.RGBA,
    glCtx.UNSIGNED_BYTE,
    null
  );
  glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_MIN_FILTER, glCtx.LINEAR);
  glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_MAG_FILTER, glCtx.LINEAR);
  glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_WRAP_S, glCtx.CLAMP_TO_EDGE);
  glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_WRAP_T, glCtx.CLAMP_TO_EDGE);

  glCtx.bindFramebuffer(glCtx.FRAMEBUFFER, fbo);
  glCtx.framebufferTexture2D(
    glCtx.FRAMEBUFFER,
    glCtx.COLOR_ATTACHMENT0,
    glCtx.TEXTURE_2D,
    texture,
    0
  );

  const status = glCtx.checkFramebufferStatus(glCtx.FRAMEBUFFER);
  if (status !== glCtx.FRAMEBUFFER_COMPLETE) {
    console.error("Framebuffer incomplete:", status);
    return null;
  }

  glCtx.bindFramebuffer(glCtx.FRAMEBUFFER, null);
  glCtx.bindTexture(glCtx.TEXTURE_2D, null);

  return { fbo, texture, width, height };
};

const initPrograms = (): boolean => {
  if (!gl) return false;

  programs.base = createProgram(gl, vertexShaderSource, baseFlowFragmentShader);
  programs.swirl = createProgram(gl, vertexShaderSource, swirlLayerFragmentShader);
  programs.glow = createProgram(gl, vertexShaderSource, glowLayerFragmentShader);
  programs.streaks = createProgram(gl, vertexShaderSource, streaksLayerFragmentShader);
  programs.composite = createProgram(gl, vertexShaderSource, compositeFragmentShader);

  if (!programs.base || !programs.swirl || !programs.glow || !programs.streaks || !programs.composite) {
    console.error("Failed to create shader programs");
    return false;
  }

  // 创建全屏四边形
  positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW
  );

  return true;
};

const initFramebuffers = (width: number, height: number): boolean => {
  if (!gl) return false;

  // Base: 全分辨率
  framebuffers.base = createFramebuffer(gl, width, height);
  
  // Swirl: 0.75 分辨率
  const swirlW = Math.floor(width * config.swirlResolution);
  const swirlH = Math.floor(height * config.swirlResolution);
  framebuffers.swirl = createFramebuffer(gl, swirlW, swirlH);
  
  // Glow: 0.5 分辨率（更柔和）
  const glowW = Math.floor(width * config.glowResolution);
  const glowH = Math.floor(height * config.glowResolution);
  framebuffers.glow = createFramebuffer(gl, glowW, glowH);
  
  // Streaks: 全分辨率（流光需要清晰）
  framebuffers.streaks = createFramebuffer(gl, width, height);

  return !!(framebuffers.base && framebuffers.swirl && framebuffers.glow && framebuffers.streaks);
};

const renderPass = (
  program: WebGLProgram,
  fbo: WebGLFramebuffer | null,
  width: number,
  height: number,
  setupUniforms: () => void
) => {
  if (!gl || !positionBuffer) return;

  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.viewport(0, 0, width, height);
  gl.useProgram(program);

  // 绑定顶点
  const posLoc = gl.getAttribLocation(program, "position");
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  // 设置 uniforms
  setupUniforms();

  // 绘制
  gl.drawArrays(gl.TRIANGLES, 0, 6);
};

const render = (now: number) => {
  if (!gl || !programs.base || !programs.swirl || !programs.glow || !programs.streaks || !programs.composite) return;
  if (!framebuffers.base || !framebuffers.swirl || !framebuffers.glow || !framebuffers.streaks) return;

  if (now - lastRenderTime < FRAME_INTERVAL) return;
  lastRenderTime = now - ((now - lastRenderTime) % FRAME_INTERVAL);

  const delta = now - lastFrameTime;
  lastFrameTime = now;
  if (playing && !paused) {
    timeAccumulator += delta;
  }

  const time = timeAccumulator * 0.0003;
  
  // 确保至少有 4 个颜色
  const defaultColors = [
    "rgb(8, 18, 25)",
    "rgb(25, 60, 70)",
    "rgb(90, 150, 140)",
    "rgb(180, 120, 90)",
  ];
  
  let colors = currentColors.length >= 4 ? currentColors : [...currentColors];
  while (colors.length < 4) {
    colors = colors.concat(defaultColors);
  }
  colors = colors.slice(0, 4);
  
  const [c1, c2, c3, c4] = colors.map(parseColor);

  const canvasWidth = gl.canvas.width;
  const canvasHeight = gl.canvas.height;

  // Pass 1: Base Flow
  renderPass(
    programs.base,
    framebuffers.base.fbo,
    framebuffers.base.width,
    framebuffers.base.height,
    () => {
      if (!gl || !programs.base) return;
      gl.uniform2f(gl.getUniformLocation(programs.base, "uResolution"), canvasWidth, canvasHeight);
      gl.uniform1f(gl.getUniformLocation(programs.base, "uTime"), time);
      gl.uniform3f(gl.getUniformLocation(programs.base, "uColor1"), c1[0], c1[1], c1[2]);
      gl.uniform3f(gl.getUniformLocation(programs.base, "uColor2"), c2[0], c2[1], c2[2]);
    }
  );

  // Pass 2: Swirl Layer
  renderPass(
    programs.swirl,
    framebuffers.swirl.fbo,
    framebuffers.swirl.width,
    framebuffers.swirl.height,
    () => {
      if (!gl || !programs.swirl) return;
      gl.uniform2f(gl.getUniformLocation(programs.swirl, "uResolution"), canvasWidth, canvasHeight);
      gl.uniform1f(gl.getUniformLocation(programs.swirl, "uTime"), time);
      gl.uniform3f(gl.getUniformLocation(programs.swirl, "uColor2"), c2[0], c2[1], c2[2]);
      gl.uniform3f(gl.getUniformLocation(programs.swirl, "uColor3"), c3[0], c3[1], c3[2]);
      gl.uniform1f(gl.getUniformLocation(programs.swirl, "uSwirlSpeed"), config.swirlSpeed);
    }
  );

  // Pass 3: Glow Layer
  renderPass(
    programs.glow,
    framebuffers.glow.fbo,
    framebuffers.glow.width,
    framebuffers.glow.height,
    () => {
      if (!gl || !programs.glow) return;
      gl.uniform2f(gl.getUniformLocation(programs.glow, "uResolution"), canvasWidth, canvasHeight);
      gl.uniform1f(gl.getUniformLocation(programs.glow, "uTime"), time);
      gl.uniform3f(gl.getUniformLocation(programs.glow, "uAccentColor"), c4[0], c4[1], c4[2]);
      gl.uniform1f(gl.getUniformLocation(programs.glow, "uGlowIntensity"), config.glowIntensity);
    }
  );

  // Pass 4: Streaks Layer (流光)
  if (config.enableStreaks) {
    renderPass(
      programs.streaks,
      framebuffers.streaks.fbo,
      framebuffers.streaks.width,
      framebuffers.streaks.height,
      () => {
        if (!gl || !programs.streaks) return;
        gl.uniform2f(gl.getUniformLocation(programs.streaks, "uResolution"), canvasWidth, canvasHeight);
        gl.uniform1f(gl.getUniformLocation(programs.streaks, "uTime"), time);
        gl.uniform3f(gl.getUniformLocation(programs.streaks, "uAccentColor"), c4[0], c4[1], c4[2]);
      }
    );
  }

  // Final: Composite to screen
  renderPass(programs.composite, null, canvasWidth, canvasHeight, () => {
    if (!gl || !programs.composite) return;
    
    // 绑定纹理
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, framebuffers.base!.texture);
    gl.uniform1i(gl.getUniformLocation(programs.composite, "uBaseTexture"), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, framebuffers.swirl!.texture);
    gl.uniform1i(gl.getUniformLocation(programs.composite, "uSwirlTexture"), 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, framebuffers.glow!.texture);
    gl.uniform1i(gl.getUniformLocation(programs.composite, "uGlowTexture"), 2);

    if (config.enableStreaks) {
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, framebuffers.streaks!.texture);
      gl.uniform1i(gl.getUniformLocation(programs.composite, "uStreaksTexture"), 3);
    }

    gl.uniform2f(gl.getUniformLocation(programs.composite, "uResolution"), canvasWidth, canvasHeight);
    gl.uniform1f(gl.getUniformLocation(programs.composite, "uTime"), time);
    gl.uniform1f(gl.getUniformLocation(programs.composite, "uVignetteStrength"), config.vignetteStrength);
    gl.uniform1i(gl.getUniformLocation(programs.composite, "uHasStreaks"), config.enableStreaks ? 1 : 0);
  });
};

const loop = (now: number) => {
  render(now);
  rafId = self.requestAnimationFrame(loop);
};

self.onmessage = (event: MessageEvent<WorkerCommand>) => {
  const { data } = event;

  if (data.type === "init" && data.canvas) {
    gl = data.canvas.getContext("webgl");
    if (!gl) {
      console.error("WebGL not supported in worker");
      return;
    }

    gl.canvas.width = data.width || 800;
    gl.canvas.height = data.height || 600;

    if (!initPrograms()) {
      console.error("Failed to initialize programs");
      return;
    }

    if (!initFramebuffers(gl.canvas.width, gl.canvas.height)) {
      console.error("Failed to initialize framebuffers");
      return;
    }

    currentColors = data.colors || currentColors;
    lastFrameTime = performance.now();
    lastRenderTime = performance.now();
    timeAccumulator = 0;
    playing = true;
    paused = false;

    rafId = self.requestAnimationFrame(loop);
    return;
  }

  if (!gl) return;

  if (data.type === "resize" && typeof data.width === "number" && typeof data.height === "number") {
    gl.canvas.width = data.width;
    gl.canvas.height = data.height;
    
    // 重新创建 framebuffers
    initFramebuffers(data.width, data.height);
    return;
  }

  if (data.type === "colors" && data.colors) {
    currentColors = data.colors;
    return;
  }

  if (data.type === "play" && typeof data.isPlaying === "boolean") {
    playing = data.isPlaying;
    return;
  }

  if (data.type === "pause" && typeof data.paused === "boolean") {
    paused = data.paused;
    return;
  }

  if (data.type === "config" && data.config) {
    config = { ...config, ...data.config };
    return;
  }
};
