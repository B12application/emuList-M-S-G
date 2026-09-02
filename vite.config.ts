import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api/gold-price': {
        target: 'https://finans.truncgil.com',
        changeOrigin: true,
        rewrite: () => '/today.json'
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'vendor-charts': ['recharts'],
          'vendor-maps': ['leaflet', 'react-leaflet'],
          'vendor-editor': ['@tiptap/react', '@tiptap/starter-kit'],
          'vendor-docs': ['jspdf', 'papaparse', 'html2canvas']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})