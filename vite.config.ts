import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api/backend': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/backend/, '/api'),
        },
        '/api/missions': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
        '/api/qa': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
        '/api/intern': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
        '/api/obsidian': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
        '/api/9router': {
          target: 'http://127.0.0.1:20128',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/9router/, ''),
        },
      },
    },
    // OPT-02: Split Three.js (~600 KB) and vendor libs into separate chunks.
    // Eliminates the 957 KB monolith bundle → faster initial load + better caching.
    // Note: Vite 8 / Rolldown requires function form for manualChunks.
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules/three')) return 'three';
            if (id.includes('node_modules/react') || id.includes('node_modules/zustand')) return 'vendor';
          },
        },
      },
    },
  };
});
