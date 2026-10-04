import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => {
  const envDir = fileURLToPath(new URL('../../', import.meta.url));
  const apiPort = loadEnv(mode, envDir, 'PORT').PORT || '3001';
  return {
    envDir,
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            leaflet: ['leaflet'],
            react: ['react', 'react-dom'],
            data: ['@tanstack/react-query', 'socket.io-client'],
          },
        },
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': 'http://127.0.0.1:' + apiPort,
        '/socket.io': { target: 'http://127.0.0.1:' + apiPort, ws: true },
      },
    },
  };
});
