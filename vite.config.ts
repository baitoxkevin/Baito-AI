import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config = {
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    hmr: {
      overlay: true
    }
  },
  build: {
    rollupOptions: {
      input: {
        index: './index.html',
        create_kevin_admin: './src/scripts/create_kevin_admin.mjs',
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'create_kevin_admin') {
            return 'scripts/[name].js';
          }
          return 'assets/[name]-[hash].js';
        },
      },
    },
  },
};

export default defineConfig(config);
