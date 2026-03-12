import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlowingLayer, createFlowingLayers, defaultColors as mobileDefaultColors } from "./Background/mobile";
import { UIBackgroundRender } from "./Background/renderer/UIBackgroundRender";

const desktopGradientDefaults = [
  "rgb(30, 30, 60)",
  "rgb(60, 30, 90)",
  "rgb(90, 30, 60)",
];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const toRgba = (color: string, alpha: number) => {
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/i);
  if (rgbMatch) {
    return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${alpha})`;
  }

  const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/i);
  if (rgbaMatch) {
    return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${alpha})`;
  }

  const hexMatch = color.match(/^#([\da-f]{3}|[\da-f]{6})$/i);
  if (hexMatch) {
    const raw = hexMatch[1];
    const normalized = raw.length === 3
      ? raw.split("").map((ch) => ch + ch).join("")
      : raw;
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  return color;
};

const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

const calculateTransform = (layer: FlowingLayer, elapsed: number) => {
  const progress = ((elapsed + layer.startTime) % layer.duration) / layer.duration;
  const eased = easeInOutSine(progress);

  const x = layer.startX + Math.sin(progress * Math.PI * 2) * 0.15;
  const y = layer.startY + Math.cos(progress * Math.PI * 2) * 0.12;
  const scale = layer.startScale + Math.sin(progress * Math.PI * 2) * 0.08;
  const rotation = Math.sin(progress * Math.PI * 2) * 0.08;

  return { x, y, scale, rotation, eased };
};

interface FluidBackgroundProps {
  colors?: string[];
  isPlaying?: boolean;
  coverUrl?: string;
  isMobileLayout?: boolean;
  theme?: 'light' | 'dark';
}

const FluidBackground: React.FC<FluidBackgroundProps> = ({
  colors,
  isPlaying = true,
  coverUrl,
  isMobileLayout = false,
  theme = 'dark',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<UIBackgroundRender | null>(null);
  const layersRef = useRef<FlowingLayer[]>([]);
  const isPlayingRef = useRef(isPlaying);
  const startTimeOffsetRef = useRef(0);
  const lastPausedTimeRef = useRef(0);
  const colorsRef = useRef<string[] | undefined>(colors);
  const [canvasInstanceKey, setCanvasInstanceKey] = useState(0);
  const previousModeRef = useRef(isMobileLayout);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    if (previousModeRef.current !== isMobileLayout) {
      setCanvasInstanceKey((prev) => prev + 1);
      previousModeRef.current = isMobileLayout;
    }
  }, [isMobileLayout]);

  const normalizedColors = useMemo(
    () => (colors && colors.length > 0 ? colors : mobileDefaultColors),
    [colors],
  );

  const colorKey = useMemo(() => normalizedColors.join("|"), [normalizedColors]);

  useEffect(() => {
    colorsRef.current = colors && colors.length > 0 ? colors : desktopGradientDefaults;
  }, [colors]);

  useEffect(() => {
    if (!isMobileLayout) {
      layersRef.current = [];
      return;
    }
    let cancelled = false;
    const generate = async () => {
      const newLayers = await createFlowingLayers(normalizedColors, coverUrl, 2);
      if (cancelled) return;
      layersRef.current = newLayers;
    };
    generate();
    return () => {
      cancelled = true;
    };
  }, [colorKey, coverUrl, normalizedColors, isMobileLayout]);

  const renderMobileFrame = useCallback(
    (ctx: CanvasRenderingContext2D, currentTime: number) => {
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;
      let elapsed = currentTime;

      if (!isPlayingRef.current) {
        lastPausedTimeRef.current = currentTime;
        elapsed = startTimeOffsetRef.current;
      } else if (lastPausedTimeRef.current > 0) {
        startTimeOffsetRef.current = elapsed;
        lastPausedTimeRef.current = 0;
      }

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, width, height);

      if (layersRef.current.length === 0) return;

      layersRef.current.forEach((layer, index) => {
        const transform = calculateTransform(layer, elapsed);
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.rotate(transform.rotation);
        ctx.scale(transform.scale, transform.scale);
        ctx.translate(width * transform.x, height * transform.y);
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = 0.4 + index * 0.05;
        ctx.filter = `blur(20px)`;
        const drawWidth = width * 1.5;
        const drawHeight = height * 1.5;
        ctx.drawImage(
          layer.image,
          -drawWidth / 2,
          -drawHeight / 2,
          drawWidth,
          drawHeight,
        );
        ctx.restore();
      });
    },
    [],
  );

  const renderGradientFrame = useCallback((ctx: CanvasRenderingContext2D, currentTime: number) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    let elapsed = currentTime;

    if (!isPlayingRef.current) {
      lastPausedTimeRef.current = currentTime;
      elapsed = startTimeOffsetRef.current;
    } else if (lastPausedTimeRef.current > 0) {
      startTimeOffsetRef.current = elapsed;
      lastPausedTimeRef.current = 0;
    }

    const t = elapsed / 1000;
    const motionT = t * 0.18;
    const palette = colorsRef.current && colorsRef.current.length > 0
      ? colorsRef.current
      : desktopGradientDefaults;

    const x1 = width * (0.5 + Math.sin(motionT * 0.55) * 0.42);
    const y1 = height * (0.5 + Math.cos(motionT * 0.45) * 0.38);
    const x2 = width * (0.5 + Math.cos(motionT * 0.6 + 1.2) * 0.42);
    const y2 = height * (0.5 + Math.sin(motionT * 0.5 + 0.8) * 0.38);

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    const stopOffset = Math.sin(motionT * 0.35) * 0.12;

    if (palette.length >= 3) {
      gradient.addColorStop(0, palette[0]);
      gradient.addColorStop(clamp(0.42 + stopOffset, 0.22, 0.64), palette[0]);
      gradient.addColorStop(clamp(0.68 + stopOffset * 0.65, 0.5, 0.88), palette[1]);
      gradient.addColorStop(1, palette[2]);
    } else {
      palette.forEach((color, index) => {
        gradient.addColorStop(index / Math.max(1, palette.length - 1), color);
      });
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 3; i++) {
      const color = palette[i % palette.length] ?? desktopGradientDefaults[i % desktopGradientDefaults.length];
      const bx = width * (0.5 + Math.sin(motionT * (0.48 + i * 0.12) + i * 1.7) * (0.28 + i * 0.08));
      const by = height * (0.5 + Math.cos(motionT * (0.42 + i * 0.1) + i * 1.2) * (0.24 + i * 0.06));
      const radius = Math.max(width, height) * (0.34 + 0.08 * Math.sin(motionT * (0.55 + i * 0.08) + i));

      const glow = ctx.createRadialGradient(bx, by, 0, bx, by, radius);
      glow.addColorStop(0, toRgba(color, 0.3));
      glow.addColorStop(1, toRgba(color, 0));

      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.globalCompositeOperation = "source-over";
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (rendererRef.current) {
      rendererRef.current.stop();
      rendererRef.current = null;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const renderCallback = isMobileLayout ? renderMobileFrame : renderGradientFrame;
    const uiRenderer = new UIBackgroundRender(canvas, renderCallback);
    uiRenderer.resize(window.innerWidth, window.innerHeight);
    uiRenderer.setPaused(false);
    uiRenderer.start();
    rendererRef.current = uiRenderer;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      uiRenderer.resize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      uiRenderer.stop();
      rendererRef.current = null;
    };
  }, [isMobileLayout, renderGradientFrame, renderMobileFrame, canvasInstanceKey]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (renderer instanceof UIBackgroundRender) {
      // 对于移动端的动画图层，根据播放状态暂停/恢复
      // 对于桌面端的静态渐变，始终保持渲染
      if (isMobileLayout) {
        renderer.setPaused(!isPlaying);
      }
    }
  }, [isPlaying, isMobileLayout]);

  const canvasKey = `canvas-${isMobileLayout ? "mobile" : "desktop"}-${canvasInstanceKey}`;

  return (
    <canvas
      ref={canvasRef}
      key={canvasKey}
      className="fixed inset-0 w-full h-full bg-black"
      style={{ touchAction: "none" }}
    />
  );
};

export default FluidBackground;
