import React, { useEffect, useRef, useMemo } from 'react';

interface ShaderBackground2Props {
  isPlaying?: boolean;
  colors?: string[];
}

const ShaderBackground2: React.FC<ShaderBackground2Props> = ({ isPlaying = true, colors }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number | undefined>(undefined);
  const pausedTimeRef = useRef<number>(0);
  const totalPausedDurationRef = useRef<number>(0);

  // Memoize colors to prevent unnecessary re-renders
  const colorKey = useMemo(() => {
    return colors && colors.length > 0 ? colors.join('|') : 'default';
  }, [colors]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') as WebGLRenderingContext | null;
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }
    glRef.current = gl;

    // Vertex shader
    const vertexShaderSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Fragment shader - Frostbyte's Volumetric Raymarching
    const fragmentShaderSource = `
      precision highp float;

      uniform float iTime;
      uniform vec2 iResolution;
      uniform vec3 iColor1;
      uniform vec3 iColor2;
      uniform vec3 iColor3;

      // 2d rotation matrix
      mat2 r(float t) {
        float s = sin(t);
        float c = cos(t);
        return mat2(c, -s, s, c);
      }

      // ACES tonemap
      vec3 aces(vec3 c) {
        mat3 m1 = mat3(
          0.59719, 0.35458, 0.04823,
          0.07600, 0.90834, 0.01566,
          0.02840, 0.13383, 0.83777
        );
        mat3 m2 = mat3(
          1.60475, -0.53108, -0.07367,
          -0.10208, 1.10813, -0.00605,
          -0.00327, -0.07276, 1.07602
        );
        vec3 v = m1 * c;
        vec3 a_val = v * (v + 0.0245786) - 0.000090537;
        vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
        return m2 * (a_val / b);
      }

      // Dot Noise
      float noise(vec3 p) {
        float PHI = 1.618033988;
        mat3 GOLD = mat3(
          -0.571464913, -0.278044873, 0.772087367,
          0.814921382, -0.303026659, 0.494042493,
          0.096597072, 0.911518454, 0.399753815
        );
        vec3 v1 = cos(GOLD * p);
        vec3 v2 = sin(PHI * p * GOLD);
        return dot(v1, v2);
      }

      void main() {
        vec2 u = gl_FragCoord.xy;
        float t = iTime * 0.3;
        
        vec3 p = vec3(0.0, 0.0, t);
        vec3 d = normalize(vec3((2.0 * u - iResolution.xy) / iResolution.y, 1.0));
        vec3 l = vec3(0.0);
        
        // 计算到中心的距离，用于黑洞效果
        vec2 center = iResolution.xy * 0.5;
        float distToCenter = length(u - center) / length(center);
        
        for(float i = 0.0; i < 10.0; i += 1.0) {
          vec3 b = p;
          vec2 sinxy = sin(b.xy);
          b.xy = r(t * 1.5 + b.z * 3.0) * sinxy;
          
          float s = 0.001 + abs(noise(b * 12.0) / 12.0 - noise(b)) * 0.4;
          s = max(s, 2.0 - length(p.xy));
          s += abs(p.y * 0.75 + sin(p.z + t * 0.1 + p.x * 1.5)) * 0.2;
          
          p += d * s;
          
          // 黑洞效果：中心更暗，边缘有光晕
          float depth = length(p.xy);
          float blackHoleFactor = smoothstep(0.0, 2.0, depth);
          
          // 使用封面颜色但大幅降低亮度，创造深邃感
          vec3 darkColor1 = iColor1 * 0.15; // 非常暗的主色
          vec3 darkColor2 = iColor2 * 0.25; // 稍亮的次色
          vec3 edgeGlow = iColor3 * 0.4;    // 边缘光晕
          
          // 基于深度和距离混合颜色
          vec3 colorMix = mix(
            darkColor1,
            mix(darkColor2, edgeGlow, blackHoleFactor),
            smoothstep(0.5, 2.0, depth)
          );
          
          // 添加体积光效果
          float volumetric = (1.0 + sin(i + depth * 0.5)) / s;
          l += colorMix * volumetric * blackHoleFactor;
        }
        
        // 降低整体亮度，增强黑洞感
        vec3 finalColor = aces(l * l / 800.0); // 更暗的输出
        
        // 添加中心黑洞遮罩
        float vignette = smoothstep(0.0, 0.8, distToCenter);
        finalColor *= vignette;
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const createShader = (type: number, source: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const shaderType = type === gl.VERTEX_SHADER ? 'VERTEX' : 'FRAGMENT';
        console.error(`${shaderType} Shader compile error:`, gl.getShaderInfoLog(shader));
        console.error('Shader source:', source);
        gl.deleteShader(shader);
        return null;
      }
      
      return shader;
    };

    const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }
    
    programRef.current = program;

    // Setup geometry
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Get uniform locations
    const iTimeLocation = gl.getUniformLocation(program, 'iTime');
    const iResolutionLocation = gl.getUniformLocation(program, 'iResolution');
    const iColor1Location = gl.getUniformLocation(program, 'iColor1');
    const iColor2Location = gl.getUniformLocation(program, 'iColor2');
    const iColor3Location = gl.getUniformLocation(program, 'iColor3');

    // Parse colors from RGB strings
    const parseColor = (colorStr: string): [number, number, number] => {
      const match = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        return [
          parseInt(match[1]) / 255,
          parseInt(match[2]) / 255,
          parseInt(match[3]) / 255
        ];
      }
      return [0.5, 0.3, 0.7]; // Default purple
    };

    const color1 = colors && colors[0] ? parseColor(colors[0]) : [0.5, 0.3, 0.7];
    const color2 = colors && colors[1] ? parseColor(colors[1]) : [0.7, 0.3, 0.5];
    const color3 = colors && colors[2] ? parseColor(colors[2]) : [0.3, 0.5, 0.7];

    const resize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      if (!gl || !program) return;

      const currentTime = Date.now();
      let elapsedTime: number;

      if (isPlaying) {
        if (pausedTimeRef.current > 0) {
          totalPausedDurationRef.current += currentTime - pausedTimeRef.current;
          pausedTimeRef.current = 0;
        }
        elapsedTime = (currentTime - startTimeRef.current - totalPausedDurationRef.current) / 1000;
      } else {
        if (pausedTimeRef.current === 0) {
          pausedTimeRef.current = currentTime;
        }
        elapsedTime = (pausedTimeRef.current - startTimeRef.current - totalPausedDurationRef.current) / 1000;
      }

      gl.useProgram(program);
      gl.uniform1f(iTimeLocation, elapsedTime);
      gl.uniform2f(iResolutionLocation, canvas.width, canvas.height);
      gl.uniform3f(iColor1Location, color1[0], color1[1], color1[2]);
      gl.uniform3f(iColor2Location, color2[0], color2[1], color2[2]);
      gl.uniform3f(iColor3Location, color3[0], color3[1], color3[2]);

      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (gl && program) {
        gl.deleteProgram(program);
      }
    };
  }, [isPlaying, colorKey]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full bg-black"
      style={{ touchAction: 'none' }}
    />
  );
};

export default ShaderBackground2;
