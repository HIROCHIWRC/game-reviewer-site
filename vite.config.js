import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
    proxy: {
      '/covers': 'http://localhost:3001',
      '/api': 'http://localhost:3001',
      '/memes': 'http://localhost:3001',
      '/skins': 'http://localhost:3001',
      '/cases': 'http://localhost:3001',
    },
  },
})
