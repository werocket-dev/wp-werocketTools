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
  // Chemins relatifs : les assets (polices Inter…) sont résolus depuis le
  // fichier qui les référence, quel que soit l'emplacement du plugin. Avec
  // la base '/' par défaut, le CSS pointait vers /assets/… à la racine du
  // domaine (404 sur tous les sites).
  base: './',
  build: {
    // Hors du dossier caché .vite/ (cf. ViteAssets::manifest()).
    manifest: 'manifest.json',
    outDir: 'dist',
    rollupOptions: {
      input: {
        admin: r('src/admin/main.tsx'),
        cookies: r('src/frontend/cookies/main.tsx'),
        reviews: r('src/frontend/reviews/main.tsx'),
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
