// vite.config.ts (VERSÃO FINAL)

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // <-- MUDANÇA PRINCIPAL: Nos dá controle total sobre o prompt.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw-push-listener.js',
      
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },

      manifest: {
        name: 'Clube Futuro Palpites',
        short_name: 'Futuro Palpites',
        description: 'Seu bolão de futebol online.',
        theme_color: '#0F1A4D',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});