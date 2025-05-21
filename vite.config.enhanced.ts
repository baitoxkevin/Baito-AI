import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __ENHANCED_MODE__: JSON.stringify(true),
  },
  // Configure the entry point to use the enhanced main file
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index-enhanced.html'),
      },
    },
  },
  // Override the standard entry to use the enhanced version
  server: {
    port: 5174, // Different port from standard dev server
  },
  optimizeDeps: {
    include: [
      'framer-motion',
      'react-dom',
      'react-router-dom',
    ],
  },
})