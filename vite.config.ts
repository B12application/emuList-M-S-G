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
  }
})