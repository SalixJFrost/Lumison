/**
 * 三层 FBO 渲染器 - 主线程接口
 * 管理 Web Worker 和配置
 */

export interface RenderConfig {
  swirlSpeed?: number;
  glowIntensity?: number;
  vignetteStrength?: number;
  glowResolution?: number;
  swirlResolution?: number;
}

export class MultiPassBackgroundRender {
  private worker: Worker | null = null;
  private canvas: HTMLCanvasElement;
  private offscreenCanvas: OffscreenCanvas | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  static isSupported(canvas: HTMLCanvasElement): boolean {
    if (typeof OffscreenCanvas === "undefined") {
      console.log('❌ MultiPass: OffscreenCanvas not supported');
      return false;
    }
    if (typeof Worker === "undefined") {
      console.log('❌ MultiPass: Worker not supported');
      return false;
    }
    
    try {
      const testCanvas = new OffscreenCanvas(1, 1);
      const gl = testCanvas.getContext("webgl");
      if (!gl) {
        console.log('❌ MultiPass: WebGL not supported');
        return false;
      }
      console.log('✅ MultiPass: All features supported');
      return true;
    } catch (error) {
      console.log('❌ MultiPass: Feature detection failed', error);
      return false;
    }
  }

  start(colors: string[], config?: RenderConfig): void {
    if (this.worker) {
      this.stop();
    }

    try {
      // 创建 worker
      this.worker = new Worker(
        new URL("./multiPassBackground.worker.ts", import.meta.url),
        { type: "module" }
      );

      // 转移 canvas 控制权
      this.offscreenCanvas = this.canvas.transferControlToOffscreen();
      this.canvas.dataset.offscreenTransferred = "true";

      // 初始化
      this.worker.postMessage(
        {
          type: "init",
          canvas: this.offscreenCanvas,
          width: this.canvas.width,
          height: this.canvas.height,
          colors,
        },
        [this.offscreenCanvas as any]
      );

      // 如果有配置，发送配置
      if (config) {
        this.setConfig(config);
      }
    } catch (error) {
      console.error("Failed to start multi-pass background worker:", error);
      this.canvas.dataset.offscreenTransferred = "false";
    }
  }

  stop(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.offscreenCanvas = null;
    this.canvas.dataset.offscreenTransferred = "false";
  }

  resize(width: number, height: number): void {
    if (!this.worker) return;
    this.worker.postMessage({
      type: "resize",
      width,
      height,
    });
  }

  setColors(colors: string[]): void {
    if (!this.worker) return;
    this.worker.postMessage({
      type: "colors",
      colors,
    });
  }

  setPlaying(isPlaying: boolean): void {
    if (!this.worker) return;
    this.worker.postMessage({
      type: "play",
      isPlaying,
    });
  }

  setPaused(paused: boolean): void {
    if (!this.worker) return;
    this.worker.postMessage({
      type: "pause",
      paused,
    });
  }

  setConfig(config: RenderConfig): void {
    if (!this.worker) return;
    this.worker.postMessage({
      type: "config",
      config,
    });
  }

  /**
   * 根据音乐特征动态调整渲染参数
   */
  setMusicDriven(params: {
    volume?: number; // 0-1
    bpm?: number;
    energy?: number; // 0-1
  }): void {
    const { volume = 0.5, bpm = 120, energy = 0.5 } = params;

    // 音量驱动 glow 强度
    const glowIntensity = 0.6 + volume * 0.8;

    // BPM 驱动 swirl 速度
    const swirlSpeed = Math.max(0.5, Math.min(2.0, bpm / 120));

    // 能量驱动 vignette
    const vignetteStrength = 1.2 - energy * 0.4;

    this.setConfig({
      glowIntensity,
      swirlSpeed,
      vignetteStrength,
    });
  }
}
