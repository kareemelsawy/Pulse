import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// v1.5.0 - cache bust
export default defineConfig({
  plugins: [react()],
  build: {
    // Production optimizations
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,    // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
    },
    rollupOptions: {
      output: {
        // Code splitting for better caching
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 600,
  },
  // Security: prevent source maps in production
  sourcemap: false,
  // Optimize deps
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js'],
  },
  server: {
    // Security headers for dev server
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    },
  },
})
