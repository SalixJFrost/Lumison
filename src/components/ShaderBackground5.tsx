import React, { useEffect, useRef, useMemo } from 'react';

interface ShaderBackground5Props {
  isPlaying?: boolean;
  colors?: string[];
}

const ShaderBackground5: React.FC<ShaderBackground5Props> = ({ isPlaying = true, colors }) => {
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

    // Fragment shader - Swirly Flow with slower animation
    const fragmentShaderSource = `
      precision highp float;

      uniform float iTime;
      uniform vec2 iResolution;
      uniform vec3 iColor1;
      uniform vec3 iColor2;
      uniform vec3 iColor3;

      vec2 Rot(vec2 p, float t) {
        float c = cos(t);
        float s = sin(t);
        return vec2(p.x*c+p.y*s, -p.x*s+p.y*c);
      }

      vec2 RotCS(vec2 p, float c, float s) {
        return vec2(p.x*c+p.y*s, -p.x*s+p.y*c);
      }

      /* discontinuous pseudorandom uniformly distributed in [-0.5, +0.5]^3 */
      vec3 random3(vec3 c) {
        float j = 4096.0*sin(dot(c,vec3(17.0, 59.4, 15.0)));
        vec3 r;
        r.z = fract(512.0*j);
        j *= .125;
        r.x = fract(512.0*j);
        j *= .125;
        r.y = fract(512.0*j);
        r = r-0.5;
        // Slower rotation
        float t = -iTime*.25;
        r.xy = Rot(r.xy,t);
        return r;
      }

      const float F3 = 0.3333333;
      const float G3 = 0.1666667;

      /* 3d simplex noise */
      float noise3(vec3 p) {
        vec3 s = floor(p + dot(p, vec3(F3)));
        vec3 x = p - s + dot(s, vec3(G3));
        
        vec3 e = step(vec3(0.0), x - x.yzx);
        vec3 i1 = e*(1.0 - e.zxy);
        vec3 i2 = 1.0 - e.zxy*(1.0 - e);
        
        vec3 x1 = x - i1 + G3;
        vec3 x2 = x - i2 + 2.0*G3;
        vec3 x3 = x - 1.0 + 3.0*G3;
        
        vec4 w, d;
        w.x = dot(x, x);
        w.y = dot(x1, x1);
        w.z = dot(x2, x2);
        w.w = dot(x3, x3);
        
        w = max(0.6 - w, 0.0);
        
        d.x = dot(random3(s), x);
        d.y = dot(random3(s + i1), x1);
        d.z = dot(random3(s + i2), x2);
        d.w = dot(random3(s + 1.0), x3);
        
        w *= w;
        w *= w;
        d *= w;
        
        return dot(d, vec4(52.0));
      }

      vec2 hash(vec2 p) {
        p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)));
        vec2 h = -1.0 + 2.0*fract(sin(p)*43758.5453123);
        // Slower rotation
        float t = -iTime*0.35;
        float co = cos(t);
        float si = sin(t);
        h = RotCS(h,co,si);
        return h;
      }

      float noise2(in vec2 p) {
        const float K1 = 0.366025404;
        const float K2 = 0.211324865;
        
        vec2 i = floor(p + (p.x+p.y)*K1);
        vec2 a = p - i + (i.x+i.y)*K2;
        vec2 o = (a.x>a.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
        vec2 b = a - o + K2;
        vec2 c = a - 1.0 + 2.0*K2;
        
        // Slower rotation
        float t = iTime*.25;
        float co = cos(t);
        float si = sin(t);
        a = RotCS(a,co,si);
        b = RotCS(b,co,si);
        c = RotCS(c,co,si);
        
        vec3 h = max(0.5-vec3(dot(a,a), dot(b,b), dot(c,c)), 0.0);
        vec3 n = h*h*h*h*vec3(dot(a,hash(i+0.0)), dot(b,hash(i+o)), dot(c,hash(i+1.0)));
        
        return dot(n, vec3(70.0));
      }

      float pot(vec2 pos) {
        // Slower time multiplier
        float t = iTime*.05;
        vec3 p = vec3(pos+vec2(iTime*.2,0.),t);
        float n = noise3(p);
        n += 0.5 * noise3(p*2.13);
        n += 3. * noise2(pos*0.333);
        return n;
      }

      vec2 field(vec2 pos) {
        float s = 1.5;
        pos *= s;
        float n = pot(pos);
        float e = 0.1;
        float nx = pot(vec2(pos+vec2(e,0.)));
        float ny = pot(vec2(pos+vec2(0.,e)));
        return vec2(-(ny-n),nx-n)/e;
      }

      void main() {
        vec2 fragCoord = gl_FragCoord.xy;
        float lod = 0.;
        vec2 uv = fragCoord.xy;
        uv /= iResolution.xy;
        uv.x *= iResolution.x/iResolution.y;
        uv.y = 1. - uv.y;
        
        vec3 d = vec3(0.);
        vec3 e = vec3(0.);
        
        for (int i=0; i<25; i++) {
          // Use cover colors instead of texture
          float t1 = fract(length(uv) + iTime*0.025);
          float t2 = fract(length(-uv.yx*3.) + iTime*0.00625);
          
          d += mix(iColor1, iColor2, t1);
          e += mix(iColor2, iColor3, t2);
          
          vec2 new_uv = field(uv)*.00625*.5;
          lod += length(new_uv)*5.;
          uv += new_uv;
        }
        
        float t3 = fract(length(uv*.1) + iTime*0.0125);
        vec3 c = mix(iColor3, iColor1, t3);
        
        d *= (1./50.);
        e *= (1./50.);
        c = mix(c,d,length(d));
        c = mix(c,e,length(e));
        
        gl_FragColor = vec4(c, 1.0);
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
      return [0.2, 0.5, 0.7];
    };

    const color1 = colors && colors[0] ? parseColor(colors[0]) : [0.2, 0.5, 0.7];
    const color2 = colors && colors[1] ? parseColor(colors[1]) : [0.5, 0.3, 0.6];
    const color3 = colors && colors[2] ? parseColor(colors[2]) : [0.3, 0.6, 0.8];

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

export default ShaderBackground5;
