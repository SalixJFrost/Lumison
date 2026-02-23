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

// 通用噪声函数
const noiseCommon = `
  vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
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

// Pass 1: Base Flow Shader (低频空间层 - 增强流动感)
export const baseFlowFragmentShader = `
  precision highp float;
  
  uniform vec2 uResolution;
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  
  varying vec2 vUv;
  
  ${noiseCommon}
  
  void main() {
    vec2 uv = vUv;
    float ratio = uResolution.x / uResolution.y;
    uv.x *= ratio;
    
    // 增强流动速度和幅度 - 更像 Apple Music
    vec2 flowUv = uv * 0.35 + uTime * 0.06;
    
    // 多层流动叠加
    float base = fbm(flowUv);
    float flow1 = fbm(flowUv + vec2(uTime * 0.04, uTime * 0.03));
    float flow2 = fbm(flowUv * 1.5 - vec2(uTime * 0.03, uTime * 0.04));
    
    // 混合多层流动
    base = mix(base, flow1, 0.4);
    base = mix(base, flow2, 0.3);
    
    // 增加对比度和平滑过渡
    vec3 color = mix(uColor1, uColor2, smoothstep(0.15, 0.85, base));
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Pass 2: Swirl Layer Shader (旋转流体层 - 增强螺旋流动)
export const swirlLayerFragmentShader = `
  precision highp float;
  
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
    uv.x *= ratio;
    
    // 中心化
    vec2 centered = uv - vec2(ratio * 0.5, 0.5);
    float dist = length(centered);
    
    // 增强螺旋旋转 - 更流畅的旋转
    float angle = uTime * uSwirlSpeed * 0.2 + dist * 2.0;
    vec2 rotated = rotate2d(angle) * centered;
    rotated += vec2(ratio * 0.5, 0.5);
    
    // 增强空间扭曲感 - 多层流动
    vec2 swirlUv = rotated * 0.7 + vec2(sin(uTime * 0.1), cos(uTime * 0.08)) * 0.2;
    float swirl = fbm(swirlUv);
    
    // 增加层次和动态 - 更多细节
    float detail1 = noise(swirlUv * 2.0 + uTime * 0.06);
    float detail2 = noise(swirlUv * 3.5 - uTime * 0.04);
    swirl = mix(swirl, detail1, 0.35);
    swirl = mix(swirl, detail2, 0.25);
    
    // 径向渐变增强深度
    float radialGrad = 1.0 - smoothstep(0.0, 1.2, dist);
    swirl = mix(swirl, swirl * radialGrad, 0.3);
    
    vec3 color = mix(uColor2, uColor3, smoothstep(0.1, 0.9, swirl));
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Pass 3: Glow Layer Shader (体积高光层 - 增强光感)
export const glowLayerFragmentShader = `
  precision highp float;
  
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
    
    // 增强体积高光场的动态 - 更流畅的移动
    vec2 glowUv = uv * 0.85 - vec2(uTime * 0.035, uTime * 0.028);
    float glowField = fbm(glowUv);
    
    // 增强多层次高光 - 更柔和的光感
    float glow1 = pow(glowField, 2.5);
    float glow2 = pow(noise(glowUv * 1.6 + uTime * 0.05), 3.0);
    float glow3 = pow(noise(glowUv * 2.2 - uTime * 0.04), 3.5);
    float glow = mix(glow1, glow2, 0.4);
    glow = mix(glow, glow3, 0.3);
    
    // 增强径向流光效果 - 更自然的扩散
    vec2 center = vec2(ratio * 0.5, 0.5);
    float dist = length(uv - center);
    float radial = 1.0 - smoothstep(0.0, 1.8, dist);
    glow *= radial * 0.5 + 0.5;
    
    // 添加脉动效果
    float pulse = sin(uTime * 0.5) * 0.15 + 0.85;
    glow *= pulse;
    
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

// Final Composite Shader (合成层 - 增强混合效果 + 流光)
export const compositeFragmentShader = `
  precision highp float;
  
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
  
  // Soft light blend
  vec3 softLight(vec3 a, vec3 b) {
    return mix(
      2.0 * a * b + a * a * (1.0 - 2.0 * b),
      sqrt(a) * (2.0 * b - 1.0) + 2.0 * a * (1.0 - b),
      step(0.5, b)
    );
  }
  
  // Overlay blend
  vec3 overlay(vec3 a, vec3 b) {
    return mix(
      2.0 * a * b,
      1.0 - 2.0 * (1.0 - a) * (1.0 - b),
      step(0.5, a)
    );
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
    
    // 合成：先用 soft light 混合 base 和 swirl - 更柔和
    vec3 merged = softLight(base, swirl);
    merged = mix(base, merged, 0.7);
    
    // 使用 overlay 增加对比和深度
    merged = mix(merged, overlay(merged, swirl), 0.4);
    
    // Screen blend 添加光感，增强 glow 效果
    merged = screen(merged, glow * 1.4);
    
    // 添加流光层（如果有）
    if (uHasStreaks) {
      vec3 streaks = texture2D(uStreaksTexture, uv).rgb;
      merged = additive(merged, streaks * 1.2);
    }
    
    // 增强色偏漂移（增加流光感）- 更微妙
    merged.r += sin(uTime * 0.1) * 0.018;
    merged.b -= sin(uTime * 0.07) * 0.015;
    merged.g += cos(uTime * 0.08) * 0.012;
    
    // Vignette 效果 - 更柔和
    vec2 centered = uv - 0.5;
    float vignette = 1.0 - dot(centered, centered) * uVignetteStrength * 0.8;
    vignette = smoothstep(0.15, 1.0, vignette);
    merged *= vignette;
    
    // 微妙的整体亮度调整
    merged = pow(merged, vec3(0.95));
    
    gl_FragColor = vec4(merged, 1.0);
  }
`;
