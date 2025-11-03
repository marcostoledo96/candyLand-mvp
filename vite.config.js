import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy de API para desarrollo: /api -> http://localhost:3000
      '/api': {
  // Usar 127.0.0.1 y puerto 5050 para evitar bloqueos en 3000
  target: 'http://127.0.0.1:5050',
        changeOrigin: true,
      },
    },
  },
})
