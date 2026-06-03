// vite.config.ts
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
      // 🌟 MUDANÇA 1: Atualiza automaticamente sem travar a tela esperando um prompt manual
      registerType: 'autoUpdate', 
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw-push-listener.js',
      
      // 🌟 MUDANÇA 2: Quando usamos injectManifest, o objeto correto se chama injectManifest, e não workbox!
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // Garante que o novo service worker mate o cache antigo e assuma o controle na hora
        dontCacheBustURLsMatching: /assets\//,
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