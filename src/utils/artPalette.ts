/**
 * 艺术调色板生成器
 * 根据音乐特征和封面色温动态生成背景配色方案
 */

export type PaletteMode = "oil" | "cinema" | "night" | "warm" | "cool" | "vibrant";

export interface MusicFeatures {
  bpm?: number;
  mode?: "major" | "minor";
  energy?: number; // 0-1
  valence?: number; // 0-1 (情绪正负)
}

export interface ColorTemperature {
  warmth: number; // 0-1, 0=冷色, 1=暖色
  brightness: number; // 0-1
  saturation: number; // 0-1
}

const palettes = {
  // 油画感（暗调文艺 / 画布质感）
  oil: [
    "rgb(22, 18, 15)",   // 深棕黑底 - 伦勃朗式暗光
    "rgb(70, 45, 35)",   // 暖棕 - 画布质感
    "rgb(120, 80, 60)",  // 柔焦赭色 - 展览馆氛围
    "rgb(40, 55, 70)",   // 冷灰蓝平衡 - 暖冷对比
  ],
  
  // 电影感（深海青绿 + 微暖高光）
  cinema: [
    "rgb(8, 18, 25)",    // 深蓝绿底 - A24 电影海报基调
    "rgb(25, 60, 70)",   // 青绿主色 - 独立电影色调
    "rgb(90, 150, 140)", // 柔亮青色 - 深海质感
    "rgb(180, 120, 90)", // 暖色点睛 - 冷暖对撞
  ],
  
  // 夜色（深紫蓝 + 神秘感）
  night: [
    "rgb(15, 10, 30)",   // 深夜紫
    "rgb(40, 30, 70)",   // 暗紫蓝
    "rgb(70, 50, 100)",  // 中紫
    "rgb(50, 70, 110)",  // 冷蓝点缀
  ],
  
  // 暖色调（日落 / 温暖）
  warm: [
    "rgb(30, 20, 15)",   // 深棕底
    "rgb(90, 50, 30)",   // 暖橙棕
    "rgb(140, 80, 50)",  // 赭石色
    "rgb(180, 110, 70)", // 柔和橙
  ],
  
  // 冷色调（月光 / 清冷）
  cool: [
    "rgb(10, 15, 25)",   // 深蓝黑
    "rgb(30, 50, 70)",   // 冷蓝
    "rgb(60, 90, 120)",  // 中蓝
    "rgb(90, 120, 140)", // 浅蓝灰
  ],
  
  // 活力（高饱和 / 动感）
  vibrant: [
    "rgb(20, 10, 40)",   // 深紫底
    "rgb(80, 30, 90)",   // 鲜紫
    "rgb(120, 50, 100)", // 品红
    "rgb(90, 80, 140)",  // 亮紫蓝
  ],
};

/**
 * 分析封面图片的色温
 */
export function analyzeColorTemperature(imageData: ImageData): ColorTemperature {
  const data = imageData.data;
  let totalR = 0, totalG = 0, totalB = 0;
  let totalBrightness = 0;
  let totalSaturation = 0;
  const sampleSize = Math.min(10000, data.length / 4); // 采样以提高性能
  const step = Math.floor(data.length / 4 / sampleSize);

  for (let i = 0; i < data.length; i += step * 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    totalR += r;
    totalG += g;
    totalB += b;
    
    // 计算亮度 (perceived brightness)
    const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    totalBrightness += brightness;
    
    // 计算饱和度
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    totalSaturation += saturation;
  }

  const avgR = totalR / sampleSize;
  const avgG = totalG / sampleSize;
  const avgB = totalB / sampleSize;
  
  // 色温计算：红色多=暖，蓝色多=冷
  const warmth = (avgR - avgB) / 255 * 0.5 + 0.5; // 归一化到 0-1
  const brightness = totalBrightness / sampleSize;
  const saturation = totalSaturation / sampleSize;

  return {
    warmth: Math.max(0, Math.min(1, warmth)),
    brightness: Math.max(0, Math.min(1, brightness)),
    saturation: Math.max(0, Math.min(1, saturation)),
  };
}

/**
 * 根据音乐特征选择调色板模式
 */
export function selectPaletteModeByMusic(features: MusicFeatures): PaletteMode {
  const { bpm = 120, mode = "major", energy = 0.5, valence = 0.5 } = features;
  
  // 高能量 + 快节奏 = 活力
  if (energy > 0.7 && bpm > 130) {
    return "vibrant";
  }
  
  // 小调 + 慢节奏 = 夜色/电影感
  if (mode === "minor" && bpm < 100) {
    return energy < 0.4 ? "night" : "cinema";
  }
  
  // 高情绪正向 + 中等能量 = 暖色
  if (valence > 0.6 && energy > 0.4 && energy < 0.7) {
    return "warm";
  }
  
  // 低情绪 + 低能量 = 冷色/油画
  if (valence < 0.4 && energy < 0.5) {
    return bpm < 90 ? "oil" : "cool";
  }
  
  // 默认电影感（最百搭）
  return "cinema";
}

/**
 * 根据封面色温选择调色板模式
 */
export function selectPaletteModeByTemperature(temp: ColorTemperature): PaletteMode {
  const { warmth, brightness, saturation } = temp;
  
  // 高饱和度 = 活力
  if (saturation > 0.6) {
    return "vibrant";
  }
  
  // 暖色调 + 低亮度 = 油画
  if (warmth > 0.6 && brightness < 0.4) {
    return "oil";
  }
  
  // 暖色调 + 中高亮度 = 暖色
  if (warmth > 0.6) {
    return "warm";
  }
  
  // 冷色调 + 低亮度 = 夜色
  if (warmth < 0.4 && brightness < 0.4) {
    return "night";
  }
  
  // 冷色调 + 中高亮度 = 冷色
  if (warmth < 0.4) {
    return "cool";
  }
  
  // 默认电影感
  return "cinema";
}

/**
 * 综合分析：音乐特征 + 封面色温
 */
export function selectPaletteMode(
  musicFeatures?: MusicFeatures,
  colorTemp?: ColorTemperature
): PaletteMode {
  // 如果两者都有，综合判断
  if (musicFeatures && colorTemp) {
    const musicMode = selectPaletteModeByMusic(musicFeatures);
    const tempMode = selectPaletteModeByTemperature(colorTemp);
    
    // 如果两者一致，直接使用
    if (musicMode === tempMode) {
      return musicMode;
    }
    
    // 如果不一致，音乐特征优先（因为更能反映情绪）
    // 但如果封面色温很极端，也要考虑
    if (colorTemp.saturation > 0.7 || colorTemp.warmth > 0.8 || colorTemp.warmth < 0.2) {
      return tempMode;
    }
    
    return musicMode;
  }
  
  // 只有音乐特征
  if (musicFeatures) {
    return selectPaletteModeByMusic(musicFeatures);
  }
  
  // 只有色温
  if (colorTemp) {
    return selectPaletteModeByTemperature(colorTemp);
  }
  
  // 都没有，返回默认
  return "cinema";
}

/**
 * 生成艺术调色板
 */
export function generateArtPalette(mode: PaletteMode): string[] {
  return [...palettes[mode]];
}

/**
 * 智能生成调色板（主入口）
 */
export function generateSmartPalette(
  musicFeatures?: MusicFeatures,
  colorTemp?: ColorTemperature
): string[] {
  const mode = selectPaletteMode(musicFeatures, colorTemp);
  return generateArtPalette(mode);
}

/**
 * 从封面图片 URL 分析并生成调色板
 */
export async function generatePaletteFromCover(
  coverUrl: string,
  musicFeatures?: MusicFeatures
): Promise<string[]> {
  try {
    // 创建临时 canvas 来分析图片
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = coverUrl;
    });
    
    const canvas = document.createElement("canvas");
    const size = 100; // 缩小尺寸以提高性能
    canvas.width = size;
    canvas.height = size;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Cannot get canvas context");
    }
    
    ctx.drawImage(img, 0, 0, size, size);
    const imageData = ctx.getImageData(0, 0, size, size);
    
    const colorTemp = analyzeColorTemperature(imageData);
    return generateSmartPalette(musicFeatures, colorTemp);
  } catch (error) {
    console.warn("Failed to analyze cover image, using default palette:", error);
    return generateSmartPalette(musicFeatures);
  }
}
