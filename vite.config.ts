import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = mode === 'production';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    build: {
      // Security: No source maps in production
      sourcemap: isProduction ? false : 'inline',
      
      // Minification with security optimizations
      minify: isProduction ? 'terser' : false,
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,      // Remove console.log
          drop_debugger: true,     // Remove debugger statements
          pure_funcs: ['console.log', 'console.debug', 'console.info'], // Remove specific functions
          passes: 2,               // Multiple passes for better optimization
        },
        mangle: {
          safari10: true,          // Compatibility
        },
        format: {
          comments: false,         // Remove all comments
        },
      } : undefined,
      
      // Output configuration
      rollupOptions: {
        output: {
          // Consistent chunk naming for better caching
          chunkFileNames: isProduction ? 'assets/[name]-[hash].js' : 'assets/[name].js',
          entryFileNames: isProduction ? 'assets/[name]-[hash].js' : 'assets/[name].js',
          assetFileNames: isProduction ? 'assets/[name]-[hash].[ext]' : 'assets/[name].[ext]',
          
          // Manual chunk splitting for better caching
          manualChunks: {
            // Vendor chunks
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
            'supabase': ['@supabase/supabase-js'],
            'date-utils': ['date-fns'],
            'form-utils': ['react-hook-form', '@hookform/resolvers', 'zod'],
          },
        },
      },
      
      // Performance
      reportCompressedSize: false, // Faster builds
      chunkSizeWarningLimit: 1000, // 1MB warning
      
      // Security: Clear output directory
      emptyOutDir: true,
    },
    
    // Server configuration
    server: {
      // Security headers for development
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
      },
    },
    
    // Preview configuration (for vite preview)
    preview: {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    },
    
    // Environment variable validation
    define: {
      // Ensure environment variables are strings
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
    },
  };
});
