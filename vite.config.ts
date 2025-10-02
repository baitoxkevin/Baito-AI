import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['react', 'react-dom', 'react-dom/client'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined, // Disable manual chunking to avoid React issues
      },
    },
    cssCodeSplit: true,
    sourcemap: false, // Disable sourcemaps in production for smaller size
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    chunkSizeWarningLimit: 1000, // Warn for chunks over 1MB
  },
  server: {
    hmr: {
      overlay: true,
    },
  },
});
