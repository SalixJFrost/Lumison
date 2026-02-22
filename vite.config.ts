import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isTauri = process.env.TAURI_ENV_PLATFORM !== undefined;
  const base = isTauri ? '/' : '/Lumison/';
  
  return {
    // Use root path for Tauri, repo name for GitHub Pages
    base,
    root: '.',
    
    // Tauri uses a different server configuration
    server: {
      port: isTauri ? 1420 : 3000,
      host: '0.0.0.0',
      strictPort: true,
    },
    
    plugins: [react()],
    
    // Ensure Tauri API is available in desktop mode
    define: {
      '__TAURI__': isTauri,
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    
    // Optimize for desktop builds
    build: {
      target: isTauri ? 'esnext' : 'es2015',
      minify: mode === 'production',
      sourcemap: mode === 'development',
    },
  };
});
