import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  build: {
    // Target modern browsers only — smaller bundle
    target: 'es2020',

    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          'react-core':  ['react', 'react-dom'],
          'supabase':    ['@supabase/supabase-js'],
          'date-fns':    ['date-fns'],
        },
      },
    },

    // Inline small assets for fewer requests
    assetsInlineLimit: 4096,

    // Report bundle size warnings at 500 kB
    chunkSizeWarningLimit: 500,

    // Source maps in production for error tracking (omit if privacy-sensitive)
    sourcemap: false,

    // Minification
    minify: 'esbuild',
  },

  // Aggressive dependency pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js', 'date-fns'],
  },

  server: {
    // Security: restrict dev server to localhost
    host: 'localhost',
    port: 5173,
  },
})

