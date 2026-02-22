(function(){"use strict";const c=["rgb(60, 20, 80)","rgb(100, 40, 60)","rgb(20, 20, 40)","rgb(40, 40, 90)"],x=`
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`,T=`
  precision highp float;

  uniform vec2 uResolution;
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform vec3 uColor4;

  #define S(a,b,t) smoothstep(a,b,t)

  mat2 Rot(float a) {
      float s = sin(a);
      float c = cos(a);
      return mat2(c, -s, s, c);
  }

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

  void main() {
      vec2 uv = gl_FragCoord.xy / uResolution.xy;
      float ratio = uResolution.x / uResolution.y;

      vec2 tuv = uv;
      tuv -= 0.5;

      float degree = noise(vec2(uTime * 0.05, tuv.x * tuv.y)); // 降低旋转速度，从 0.1 改为 0.05

      tuv.y *= 1.0 / ratio;
      tuv *= Rot(radians((degree - 0.5) * 720.0 + 180.0));
      tuv.y *= ratio;

      float frequency = 5.0;
      float amplitude = 30.0;
      float speed = uTime * 0.8; // 降低速度，从 2.0 改为 0.8
      tuv.x += sin(tuv.y * frequency + speed) / amplitude;
      tuv.y += sin(tuv.x * frequency * 1.5 + speed) / (amplitude * 0.5);

      vec3 layer1 = mix(uColor1, uColor2, S(-0.3, 0.2, (tuv * Rot(radians(-5.0))).x));
      vec3 layer2 = mix(uColor3, uColor4, S(-0.3, 0.2, (tuv * Rot(radians(-5.0))).x));

      vec3 finalComp = mix(layer1, layer2, S(0.5, -0.3, tuv.y));
      vec3 col = finalComp;

      gl_FragColor = vec4(col, 1.0);
  }
`,y=16.666666666666668;let e=null,l=null,s=null,f=null,S=null,R=null,A=null,b=null,m=0,v=0,i=0,d=!0,h=!1,u=[...c];const U=r=>{const o=r.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);return o?[parseInt(o[1],10)/255,parseInt(o[2],10)/255,parseInt(o[3],10)/255]:[0,0,0]},w=(r,o,t)=>{const n=r.createShader(o);return n?(r.shaderSource(n,t),r.compileShader(n),r.getShaderParameter(n,r.COMPILE_STATUS)?n:(console.error(r.getShaderInfoLog(n)),r.deleteShader(n),null)):null},F=()=>{if(!e)return!1;const r=w(e,e.VERTEX_SHADER,x),o=w(e,e.FRAGMENT_SHADER,T);if(!r||!o)return!1;const t=e.createProgram();if(!t)return!1;e.attachShader(t,r),e.attachShader(t,o),e.linkProgram(t),e.useProgram(t);const n=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,n),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),e.STATIC_DRAW);const a=e.getAttribLocation(t,"position");return e.enableVertexAttribArray(a),e.vertexAttribPointer(a,2,e.FLOAT,!1,0,0),s=e.getUniformLocation(t,"uResolution"),f=e.getUniformLocation(t,"uTime"),S=e.getUniformLocation(t,"uColor1"),R=e.getUniformLocation(t,"uColor2"),A=e.getUniformLocation(t,"uColor3"),b=e.getUniformLocation(t,"uColor4"),l=t,!0},L=r=>{if(!e||!l||!s||!f||r-i<y)return;i=r-(r-i)%y,e.viewport(0,0,e.canvas.width,e.canvas.height),e.useProgram(l),e.uniform2f(s,e.canvas.width,e.canvas.height);const o=r-v;v=r,d&&!h&&(m+=o);const t=u.length>=4?u:c,[n,a,p,g]=t.map(U);e.uniform1f(f,m*3e-4),e.uniform3f(S,n[0],n[1],n[2]),e.uniform3f(R,a[0],a[1],a[2]),e.uniform3f(A,p[0],p[1],p[2]),e.uniform3f(b,g[0],g[1],g[2]),e.drawArrays(e.TRIANGLES,0,6)},C=r=>{L(r),self.requestAnimationFrame(C)};self.onmessage=r=>{const{data:o}=r;if(o.type==="init"&&o.canvas){const t=o.canvas;if(!t)return;if(e=t.getContext("webgl"),!e){console.error("WebGL not supported in web worker background");return}if(e.canvas.width=o.width,e.canvas.height=o.height,e.viewport(0,0,e.canvas.width,e.canvas.height),!F()){console.error("Failed to initialize shader program in worker");return}u=o.colors??c,v=performance.now(),i=performance.now(),m=0,d=!0,h=!1,self.requestAnimationFrame(C);return}if(e){if(o.type==="resize"&&typeof o.width=="number"&&typeof o.height=="number"){e.canvas.width=o.width,e.canvas.height=o.height,e.viewport(0,0,e.canvas.width,e.canvas.height);return}if(o.type==="colors"&&o.colors){u=o.colors;return}if(o.type==="play"&&typeof o.isPlaying=="boolean"){d=o.isPlaying;return}o.type==="pause"&&typeof o.paused=="boolean"&&(h=o.paused)}}})();
