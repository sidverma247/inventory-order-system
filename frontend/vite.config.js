import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// During local development, proxy /api calls to the backend so the frontend
// can use a relative base URL in both dev and production.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_TARGET || 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
