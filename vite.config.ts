import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Build optimizations
  build: {
    // Reduce chunk size warnings threshold
    chunkSizeWarningLimit: 1000,
    
    // Enable code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React and related libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Separate chunk for axios
          'api-vendor': ['axios'],
        },
      },
    },
    
    // Enable minification (esbuild is faster than terser)
    minify: 'esbuild',
    
    // Source maps for debugging
    sourcemap: false,
  },
  
  // Preview server configuration
  preview: {
    port: 5173,
    strictPort: false,
  },
  
  // Development server configuration
  server: {
    port: 5173,
    strictPort: false,
    host: true,
  },
})
