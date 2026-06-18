import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// During local `npm run dev`, proxy API resource paths to the backend so the
// frontend can use a relative base URL in both dev and production.
const target = process.env.VITE_DEV_API_TARGET || 'http://localhost:8000'
const proxy = Object.fromEntries(
  ['/products', '/customers', '/orders', '/stats', '/health'].map((p) => [
    p,
    { target, changeOrigin: true },
  ])
)

export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173, proxy },
})
