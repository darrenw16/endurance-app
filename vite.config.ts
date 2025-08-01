import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Remove the base path for Netlify (use root)
  base: '/',
  build: {
    sourcemap: true,
    outDir: 'dist',
    // Ensure assets are properly handled
    assetsDir: 'assets'
  },
  // PWA configuration for manual service worker
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
})
