# Lumison

A high-fidelity, immersive music player inspired by Apple Music.

🎵 Live Demo: https://salixjfrost.github.io/Lumison/

## screenshots
<img width="2559" height="1599" alt="image" src="https://github.com/user-attachments/assets/1eccc917-7620-478a-b46b-942d1498e92e" />
<img width="2559" height="1599" alt="image" src="https://github.com/user-attachments/assets/2ea66a19-2833-46a2-9986-b695b392b822" />
<img width="2559" height="1599" alt="image" src="https://github.com/user-attachments/assets/aa50a8eb-5476-4f62-bebf-1b7d782aa548" />
<img width="2559" height="1599" alt="image" src="https://github.com/user-attachments/assets/71d0b2d3-70af-4c38-bf41-b244718042d1" />
<img width="2559" height="1599" alt="image" src="https://github.com/user-attachments/assets/71d0b2d3-70af-4c38-bf41-b244718042d1" />






## Features

- **WebGL Fluid Background**: Dynamic fluid background effect using WebGL shaders. [Reference](https://www.shadertoy.com/view/wdyczG)
- **Canvas Lyric Rendering**: High-performance, custom-drawn lyric visualization on HTML5 Canvas
- **Music Import & Search**: Seamlessly search and import music from Netease Cloud Music or Bilibili
- **Audio Manipulation**: Real-time control over playback speed and pitch shifting
- **3D Album Cover**: Professional 3D card effect with mouse tracking
- **Multi-language Lyrics**: Support for synchronized lyrics with translations

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. (Optional) Set the `GEMINI_API_KEY` in `.env.local` for AI-powered lyrics analysis

3. Run the app:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Tech Stack

- React 19
- TypeScript
- Vite
- React Spring (animations)
- WebGL (fluid background)
- Canvas API (lyrics rendering)

## Credits

- Shader source: https://www.shadertoy.com/view/wdyczG
- Original project: Aura Music by dingyi222666

