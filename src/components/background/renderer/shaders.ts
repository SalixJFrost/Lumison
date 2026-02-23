/**
 * 三层 WebGL Framebuffer 渲染管线 - Shader 定义
 * Pass 1: Base Flow (低频空间层)
 * Pass 2: Swirl Layer (旋转流体层)
 * Pass 3: Glow Layer (体积高光层)
 * Final: Screen Blend 合成
 */

export const vertexShaderSource = `
  attribute vec2 position;
  varying vec2 vUv;
  
  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

// 通用噪声函数（改进版 - 基于 iq 的实现）
const noiseCommon = `
  vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(2127.1, 81.17)), dot(p, vec2(1269.5, 283.37)));
    return fract(sin(p) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    float n = mix(
      mix(dot(-1.0 + 2.0 * hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
          dot(-1.0 + 2.0 * hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
      mix(dot(-1.0 + 2.0 * hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
          dot(-1.0 + 2.0 * hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
    return 0.5 + 0.5 * n;
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p * frequency);
      frequency *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  mat2 rotate2d(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
  }
`;

// Pass 1: Base Flow Shader (优化性能版本)
export const baseFlowFragmentShader = `
  precision mediump float;
  
  uniform vec2 uResolution;
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  
  varying vec2 vUv;
  
  ${noiseCommon}
  
  void main() {
    vec2 uv = vUv;
    float ratio = uResolution.x / uResolution.y;
    
    vec2 tuv = uv;
    tuv -= 0.5;
    
    // 使用噪声旋转 - 降低频率
    float degree = noise(vec2(uTime * 0.08, tuv.x * tuv.y));
    tuv.y *= 1.0 / ratio;
    tuv *= rotate2d(radians((degree - 0.5) * 600.0 + 180.0));
    tuv.y *= ratio;
    
    // 波浪扭曲 - 降低频率和幅度
    float frequency = 4.0;
    float amplitude = 35.0;
    float speed = uTime * 1.5;
    tuv.x += sin(tuv.y * frequency + speed) / amplitude;
    tuv.y += sin(tuv.x * frequency * 1.3 + speed) / (amplitude * 0.6);
    
    // 颜色混合
    vec3 col = mix(uColor1, uColor2, smoothstep(-0.3, 0.2, (tuv * rotate2d(radians(-5.0))).x));
    
    gl_FragColor = vec4(col, 1.0);
  }
`;

// Pass 2: Swirl Layer Shader (优化性能版本)
export const swirlLayerFragmentShader = `
  precision mediump float;
  
  uniform vec2 uResolution;
  uniform float uTime;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform float uSwirlSpeed;
  
  varying vec2 vUv;
  
  ${noiseCommon}
  
  void main() {
    vec2 uv = vUv;
    float ratio = uResolution.x / uResolution.y;
    
    vec2 tuv = uv;
    tuv -= 0.5;
    
    // 使用噪声旋转 - 降低频率
    float degree = noise(vec2(uTime * 0.12 * uSwirlSpeed, tuv.y * tuv.x));
    tuv.y *= 1.0 / ratio;
    tuv *= rotate2d(radians((degree - 0.5) * 480.0));
    tuv.y *= ratio;
    
    // 不同的波浪参数 - 降低频率
    float frequency = 3.5;
    float amplitude = 28.0;
    float speed = uTime * 1.2 * uSwirlSpeed;
    tuv.x += sin(tuv.y * frequency + speed) / amplitude;
    tuv.y += sin(tuv.x * frequency * 1.1 + speed) / (amplitude * 0.7);
    
    // 颜色混合
    vec3 col = mix(uColor2, uColor3, smoothstep(-0.3, 0.2, (tuv * rotate2d(radians(-5.0))).x));
    
    gl_FragColor = vec4(col, 1.0);
  }
`;

// Pass 3: Glow Layer Shader (优化性能版本)
export const glowLayerFragmentShader = `
  precision mediump float;
  
  uniform vec2 uResolution;
  uniform float uTime;
  uniform vec3 uAccentColor;
  uniform float uGlowIntensity;
  
  varying vec2 vUv;
  
  ${noiseCommon}
  
  void main() {
    vec2 uv = vUv;
    float ratio = uResolution.x / uResolution.y;
    uv.x *= ratio;
    
    // 简化的高光场 - 减少计算
    vec2 glowUv = uv * 0.9 - vec2(uTime * 0.03, uTime * 0.025);
    float glowField = fbm(glowUv);
    
    // 简化为两层高光
    float glow1 = pow(glowField, 2.8);
    float glow2 = pow(noise(glowUv * 1.5 + uTime * 0.04), 3.2);
    float glow = mix(glow1, glow2, 0.5);
    
    // 径向流光效果
    vec2 center = vec2(ratio * 0.5, 0.5);
    float dist = length(uv - center);
    float radial = 1.0 - smoothstep(0.0, 1.6, dist);
    glow *= radial * 0.6 + 0.4;
    
    // 应用强度
    glow *= uGlowIntensity;
    
    vec3 color = glow * uAccentColor;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Pass 4: Streaks Layer Shader (流光粒子层)
export const streaksLayerFragmentShader = `
  precision highp float;
  
  uniform vec2 uResolution;
  uniform float uTime;
  uniform vec3 uAccentColor;
  
  varying vec2 vUv;
  
  ${noiseCommon}
  
  // 生成流光线条
  float streak(vec2 uv, vec2 start, vec2 dir, float speed, float width, float streakLength) {
    vec2 toPoint = uv - start;
    float proj = dot(toPoint, dir);
    float dist = length(toPoint - dir * proj);
    
    // 流光的头尾渐变
    float head = smoothstep(streakLength, streakLength * 0.3, proj);
    float tail = smoothstep(-0.1, 0.0, proj);
    
    // 宽度衰减
    float intensity = smoothstep(width, 0.0, dist);
    
    return intensity * head * tail;
  }
  
  void main() {
    vec2 uv = vUv;
    float ratio = uResolution.x / uResolution.y;
    uv.x *= ratio;
    
    vec3 color = vec3(0.0);
    
    // 生成多条流光
    for (int i = 0; i < 8; i++) {
      float fi = float(i);
      float seed = fi * 12.345;
      
      // 随机起点和方向
      float angle = noise(vec2(seed, 0.0)) * 6.28318;
      float startX = noise(vec2(seed, 1.0)) * ratio;
      float startY = noise(vec2(seed, 2.0));
      
      // 流光移动
      float phase = fract(uTime * 0.15 + noise(vec2(seed, 3.0)));
      vec2 start = vec2(startX, startY) + vec2(cos(angle), sin(angle)) * phase * 1.5;
      vec2 dir = normalize(vec2(cos(angle), sin(angle)));
      
      // 流光参数
      float width = 0.002 + noise(vec2(seed, 4.0)) * 0.003;
      float streakLen = 0.15 + noise(vec2(seed, 5.0)) * 0.2;
      
      // 计算流光强度
      float s = streak(uv, start, dir, 0.3, width, streakLen);
      
      // 颜色变化
      vec3 streakColor = uAccentColor;
      streakColor += vec3(
        sin(uTime * 0.5 + fi) * 0.2,
        cos(uTime * 0.7 + fi) * 0.2,
        sin(uTime * 0.3 + fi) * 0.2
      );
      
      color += s * streakColor * (0.6 + noise(vec2(seed, 6.0)) * 0.4);
    }
    
    // 添加闪烁效果
    float flicker = sin(uTime * 2.0) * 0.1 + 0.9;
    color *= flicker;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Final Composite Shader (优化性能版本)
export const compositeFragmentShader = `
  precision mediump float;
  
  uniform sampler2D uBaseTexture;
  uniform sampler2D uSwirlTexture;
  uniform sampler2D uGlowTexture;
  uniform sampler2D uStreaksTexture;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uVignetteStrength;
  uniform bool uHasStreaks;
  
  varying vec2 vUv;
  
  // Screen blend mode
  vec3 screen(vec3 a, vec3 b) {
    return 1.0 - (1.0 - a) * (1.0 - b);
  }
  
  // Additive blend
  vec3 additive(vec3 a, vec3 b) {
    return min(a + b, vec3(1.0));
  }
  
  void main() {
    vec2 uv = vUv;
    
    // 采样所有层
    vec3 base = texture2D(uBaseTexture, uv).rgb;
    vec3 swirl = texture2D(uSwirlTexture, uv).rgb;
    vec3 glow = texture2D(uGlowTexture, uv).rgb;
    
    // 简化混合 - 直接 mix
    vec3 merged = mix(base, swirl, 0.5);
    
    // Screen blend 添加 glow
    merged = screen(merged, glow * 1.1);
    
    // 添加流光层（如果有）
    if (uHasStreaks) {
      vec3 streaks = texture2D(uStreaksTexture, uv).rgb;
      merged = additive(merged, streaks * 0.7);
    }
    
    // 简化色彩偏移
    merged.r += sin(uTime * 0.06) * 0.01;
    merged.b -= sin(uTime * 0.05) * 0.008;
    
    // Vignette 效果
    vec2 centered = uv - 0.5;
    float vignette = 1.0 - dot(centered, centered) * uVignetteStrength;
    vignette = smoothstep(0.25, 1.0, vignette);
    merged *= vignette;
    
    gl_FragColor = vec4(merged, 1.0);
  }
`;
