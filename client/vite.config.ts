import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'url';

export default defineConfig(({ mode }) => {
    return {
      server: {
        proxy: {
          // Proxy API requests to the backend server
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
          },
        },
      },
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('./src', import.meta.url)),
        }
      }
    };
});
