// vite.config.ts - VERSÃO COM PUSH NOTIFICATIONS

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
      registerType: 'autoUpdate',
      // Usando 'injectManifest' para controle total do Service Worker
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw-push-listener.js', // Aponta para seu arquivo customizado na pasta src
      
      // O workbox agora não precisa mais de 'globPatterns' etc.,
      // pois o manifest de precache será injetado automaticamente.
      // A configuração do Workbox pode ser mais simples ou até removida
      // se não precisar de outras regras específicas.

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