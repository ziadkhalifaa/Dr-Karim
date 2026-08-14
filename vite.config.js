import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    // Local dev: forward API calls to the backend instead of the Vite dev
    // server, so the dashboard is live against MySQL, not static.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Split vendor chunk for better caching (Rolldown-compatible function form)
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('react-dom') || id.includes('node_modules/react/')) {
            return 'vendor';
          }
          if (id.includes('i18next') || id.includes('react-i18next')) {
            return 'i18n';
          }
        },
      },
    },
  },
})
