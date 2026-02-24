import React, { useEffect, useRef, useMemo } from 'react';

interface ShaderBackground4Props {
  isPlaying?: boolean;
  colors?: string[];
}

const ShaderBackground4: React.FC<ShaderBackground4Props> = ({ isPlaying = true, colors }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number | undefined>(undefined);
  const pausedTimeRef = useRef<number>(0);
  const totalPausedDurationRef = useRef<number>(0);

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

    const vertexShaderSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `
      precision highp float;

      uniform float iTime;
      uniform vec2 iResolution;
      uniform vec3 iColor1;
      uniform vec3 iColor2;
      uniform vec3 iColor3;

      // Hash function
      vec3 hash33(vec3 p3) {
        p3 = fract(p3 * vec3(0.1031, 0.11369, 0.13787));
        p3 += dot(p3, p3.yxz + 19.19);
        return -1.0 + 2.0 * fract(vec3(p3.x + p3.y, p3.x + p3.z, p3.y + p3.z) * p3.zyx);
      }

      // 3D Simplex noise
      float snoise3(vec3 p) {
        const float K1 = 0.333333333;
        const float K2 = 0.166666667;
        
        vec3 i = floor(p + (p.x + p.y + p.z) * K1);
        vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
        
        vec3 e = step(vec3(0.0), d0 - d0.yzx);
        vec3 i1 = e * (1.0 - e.zxy);
        vec3 i2 = 1.0 - e.zxy * (1.0 - e);
        
        vec3 d1 = d0 - (i1 - K2);
        vec3 d2 = d0 - (i2 - K1);
        vec3 d3 = d0 - 0.5;
        
        vec4 h = max(0.6 - vec4(dot(d0, d0), dot(d1, d1), dot(d2, d2), dot(d3, d3)), 0.0);
        vec4 n = h * h * h * h * vec4(
          dot(d0, hash33(i)),
          dot(d1, hash33(i + i1)),
          dot(d2, hash33(i + i2)),
          dot(d3, hash33(i + 1.0))
        );
        
        return dot(vec4(31.316), n);
      }

      vec4 extractAlpha(vec3 colorIn) {
        vec4 colorOut;
        float maxValue = min(max(max(colorIn.r, colorIn.g), colorIn.b), 1.0);
        if (maxValue > 1e-5) {
          colorOut.rgb = colorIn.rgb * (1.0 / maxValue);
          colorOut.a = maxValue;
        } else {
          colorOut = vec4(0.0);
        }
        return colorOut;
      }

      float light1(float intensity, float attenuation, float dist) {
        return intensity / (1.0 + dist * attenuation);
      }

      float light2(float intensity, float attenuation, float dist) {
        return intensity / (1.0 + dist * dist * attenuation);
      }

      void draw(out vec4 fragColor, in vec2 vUv) {
        vec2 uv = vUv;
        float ang = atan(uv.y, uv.x);
        float len = length(uv);
        
        const float innerRadius = 0.6;
        const float noiseScale = 0.65;
        
        float v0, v1, v2, v3, cl;
        float r0, d0, n0;
        
        // Ring with noise - 减慢噪声动画速度
        n0 = snoise3(vec3(uv * noiseScale, iTime * 0.25)) * 0.5 + 0.5;
        r0 = mix(mix(innerRadius, 1.0, 0.4), mix(innerRadius, 1.0, 0.6), n0);
        d0 = distance(uv, r0 / len * uv);
        
        v0 = light1(1.0, 10.0, d0);
        v0 *= smoothstep(r0 * 1.05, r0, len);
        
        // 减慢颜色变化速度
        cl = cos(ang + iTime * 1.0) * 0.5 + 0.5;
        
        // Highlight - 减慢高光旋转速度
        float a = iTime * -0.5;
        vec2 pos = vec2(cos(a), sin(a)) * r0;
        float d = distance(uv, pos);
        
        v1 = light2(1.5, 5.0, d);
        v1 *= light1(1.0, 50.0, d0);
        
        // Back decay
        v2 = smoothstep(1.0, mix(innerRadius, 1.0, n0 * 0.5), len);
        
        // Hole
        v3 = smoothstep(innerRadius, mix(innerRadius, 1.0, 0.5), len);
        
        // Color using cover colors
        vec3 col = mix(iColor1, iColor2, cl);
        col = mix(iColor3, col, v0);
        col = (col + v1) * v2 * v3;
        col = clamp(col, 0.0, 1.0);
        
        fragColor = extractAlpha(col);
      }

      void main() {
        vec2 uv = (gl_FragCoord.xy * 2.0 - iResolution.xy) / iResolution.y;
        vec4 col;
        draw(col, uv);
        
        vec3 bg = vec3(0.0);
        gl_FragColor = vec4(mix(bg, col.rgb, col.a), 1.0);
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

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([
      -1, -1, 1, -1, -1, 1, 1, 1,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const iTimeLocation = gl.getUniformLocation(program, 'iTime');
    const iResolutionLocation = gl.getUniformLocation(program, 'iResolution');
    const iColor1Location = gl.getUniformLocation(program, 'iColor1');
    const iColor2Location = gl.getUniformLocation(program, 'iColor2');
    const iColor3Location = gl.getUniformLocation(program, 'iColor3');

    const parseColor = (colorStr: string): [number, number, number] => {
      const match = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        return [
          parseInt(match[1]) / 255,
          parseInt(match[2]) / 255,
          parseInt(match[3]) / 255
        ];
      }
      return [0.611765, 0.262745, 0.996078]; // Default purple
    };

    const color1 = colors && colors[0] ? parseColor(colors[0]) : [0.611765, 0.262745, 0.996078];
    const color2 = colors && colors[1] ? parseColor(colors[1]) : [0.298039, 0.760784, 0.913725];
    const color3 = colors && colors[2] ? parseColor(colors[2]) : [0.062745, 0.078431, 0.600000];

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

export default ShaderBackground4;
