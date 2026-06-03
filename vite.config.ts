import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'url'

function r(path: string) {
  return fileURLToPath(new URL(path, import.meta.url))
}

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  build: {
    manifest: true,
    outDir: 'dist',
    rollupOptions: {
      input: {
        admin: r('src/admin/main.tsx'),
        cookies: r('src/frontend/cookies/main.tsx'),
        reviews: r('src/frontend/reviews/main.tsx'),
        business: r('src/frontend/business/main.tsx'),
      },
    },
  },
  resolve: {
    alias: {
      '@': r('src'),
    },
  },
  server: {
    port: 5173,
    origin: 'http://localhost:5173',
    cors: true,
  },
})
