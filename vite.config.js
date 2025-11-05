// Config de Vite para dev: React + proxy /api a nuestro backend local
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // En dev usamos 127.0.0.1 y puerto 5050 para evitar dramas con IPv6/localhost
    proxy: {
      // Proxy de API para desarrollo: /api -> backend local
      '/api': {
        target: 'http://127.0.0.1:5050',
        changeOrigin: true,
      },
    },
  },
})
