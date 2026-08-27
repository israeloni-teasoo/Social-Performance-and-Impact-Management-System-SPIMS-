import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    proxy: {
      // The API dev server (server/devServer.ts, `npm run dev:api` at the repo root)
      // listens on this port. Proxying keeps the browser's view same-origin so the
      // httpOnly session cookie works without CORS/credentials complications.
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: false,
      },
    },
  },
})
