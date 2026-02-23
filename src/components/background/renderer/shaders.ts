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

// Pass 1: Base Flow Shader (低频空间层)
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
    
    // 增强流动速度和幅度
    vec2 flowUv = uv * 0.4 + uTime * 0.04;
    float base = fbm(flowUv);
    
    // 增强方向性流动
    float flow = fbm(flowUv + vec2(uTime * 0.03, uTime * 0.02));
    base = mix(base, flow, 0.5);
    
    // 增加对比度
    vec3 color = mix(uColor1, uColor2, smoothstep(0.2, 0.8, base));
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Pass 2: Swirl Layer Shader (旋转流体层)
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
    
    // 增强旋转扭曲
    float angle = uTime * uSwirlSpeed * 0.15;
    vec2 rotated = rotate2d(angle) * centered;
    rotated += vec2(ratio * 0.5, 0.5);
    
    // 增强空间扭曲感
    vec2 swirlUv = rotated * 0.8 + vec2(sin(uTime * 0.08), cos(uTime * 0.08)) * 0.15;
    float swirl = fbm(swirlUv);
    
    // 增加层次和动态
    float detail = noise(swirlUv * 2.5 + uTime * 0.05);
    swirl = mix(swirl, detail, 0.4);
    
    vec3 color = mix(uColor2, uColor3, smoothstep(0.15, 0.85, swirl));
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Pass 3: Glow Layer Shader (体积高光层)
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
    
    // 增强体积高光场的动态
    vec2 glowUv = uv * 0.9 - vec2(uTime * 0.025, uTime * 0.02);
    float glowField = fbm(glowUv);
    
    // 增强多层次高光
    float glow1 = pow(glowField, 2.8);
    float glow2 = pow(noise(glowUv * 1.8 + uTime * 0.04), 3.5);
    float glow = mix(glow1, glow2, 0.5);
    
    // 增强径向流光效果
    vec2 center = vec2(ratio * 0.5, 0.5);
    float dist = length(uv - center);
    float radial = 1.0 - smoothstep(0.0, 1.5, dist);
    glow *= radial * 0.6 + 0.4;
    
    // 应用强度
    glow *= uGlowIntensity;
    
    vec3 color = glow * uAccentColor;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Final Composite Shader (合成层)
export const compositeFragmentShader = `
  precision highp float;
  
  uniform sampler2D uBaseTexture;
  uniform sampler2D uSwirlTexture;
  uniform sampler2D uGlowTexture;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uVignetteStrength;
  
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
  
  void main() {
    vec2 uv = vUv;
    
    // 采样三层
    vec3 base = texture2D(uBaseTexture, uv).rgb;
    vec3 swirl = texture2D(uSwirlTexture, uv).rgb;
    vec3 glow = texture2D(uGlowTexture, uv).rgb;
    
    // 合成：先混合 base 和 swirl，增强混合强度
    vec3 merged = mix(base, swirl, 0.6);
    
    // 使用 overlay 增加对比和深度
    merged = overlay(merged, swirl);
    
    // Screen blend 添加光感，增强 glow 效果
    merged = screen(merged, glow * 1.2);
    
    // 增强色偏漂移（增加流光感）
    merged.r += sin(uTime * 0.08) * 0.025;
    merged.b -= sin(uTime * 0.05) * 0.02;
    merged.g += cos(uTime * 0.06) * 0.015;
    
    // Vignette 效果
    vec2 centered = uv - 0.5;
    float vignette = 1.0 - dot(centered, centered) * uVignetteStrength;
    vignette = smoothstep(0.2, 1.0, vignette);
    merged *= vignette;
    
    gl_FragColor = vec4(merged, 1.0);
  }
`;
