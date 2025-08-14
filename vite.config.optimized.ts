import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react({
      // Use SWC for faster builds
      fastRefresh: true,
      // Remove React DevTools in production
      babel: {
        plugins: [
          ['@babel/plugin-transform-react-remove-prop-types', { removeImport: true }],
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Performance optimizations
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        passes: 2,
      },
      mangle: true,
      format: {
        comments: false,
      },
    },
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          // React ecosystem in one chunk
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // UI components in separate chunk
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-slot',
            '@radix-ui/react-label',
            '@radix-ui/react-toast',
            'class-variance-authority',
            'clsx',
            'tailwind-merge',
          ],
          // Animation libraries
          'animation': ['framer-motion'],
          // Heavy libraries
          'supabase': ['@supabase/supabase-js'],
          // Icons
          'icons': ['lucide-react'],
        },
        // Optimize chunk names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : '';
          if (facadeModuleId.includes('node_modules')) {
            return 'vendor/[name].[hash].js';
          }
          return 'assets/[name].[hash].js';
        },
        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name?.split('.').at(-1);
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType || '')) {
            return 'img/[name].[hash][extname]';
          }
          if (/woff2?|ttf|otf|eot/i.test(extType || '')) {
            return 'fonts/[name].[hash][extname]';
          }
          return 'assets/[name].[hash][extname]';
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Enable source maps for production debugging
    sourcemap: false,
    // Inline assets smaller than 4kb
    assetsInlineLimit: 4096,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Report compressed size
    reportCompressedSize: true,
  },
  optimizeDeps: {
    // Pre-bundle dependencies for faster dev server
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'framer-motion',
    ],
    // Exclude icons to avoid long initial bundling
    exclude: ['lucide-react'],
    // Force optimization on these packages
    force: true,
    esbuildOptions: {
      target: 'es2015',
      // Enable tree shaking
      treeShaking: true,
    },
  },
  server: {
    // Warm up frequently used modules
    warmup: {
      clientFiles: [
        './src/main.tsx',
        './src/App.tsx',
        './src/pages/LoginPageOptimized.tsx',
        './src/lib/auth-optimized.ts',
      ],
    },
    // Enable CORS for assets
    cors: true,
    // Preload modules
    preTransformRequests: true,
  },
  preview: {
    // Enable compression in preview
    cors: true,
    headers: {
      'Cache-Control': 'public, max-age=31536000',
    },
  },
  // CSS optimization
  css: {
    devSourcemap: false,
    modules: {
      localsConvention: 'camelCase',
    },
    postcss: {
      plugins: [
        // Add autoprefixer and cssnano for production
      ],
    },
  },
  // Enable experimental features
  experimental: {
    renderBuiltUrl: (filename) => {
      // Use CDN in production
      if (process.env.NODE_ENV === 'production' && process.env.CDN_URL) {
        return `${process.env.CDN_URL}/${filename}`;
      }
      return `/${filename}`;
    },
  },
});