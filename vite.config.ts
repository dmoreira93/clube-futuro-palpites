// vite.config.ts - VERSÃO FINAL E UNIFICADA

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc"; // Mantendo sua versão do plugin React, que é mais rápida.
import path from "path";
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Mantendo suas configurações de servidor
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Força o novo service worker a se ativar assim que for baixado.
        skipWaiting: true,
        // Faz o service worker recém-ativado tomar o controle da página imediatamente.
        clientsClaim: true,
        // Remove caches de versões antigas durante a ativação do novo SW.
        cleanupOutdatedCaches: true,
        // Define explicitamente quais arquivos devem ser pré-cacheados para corrigir o warning.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm,webmanifest}'],
        // Aumenta o limite de tamanho do arquivo para 5MB para evitar erros de build.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      // Unificando seu manifesto, que estava mais completo
      manifest: {
        name: 'Clube Futuro Palpites',
        short_name: 'Futuro Palpites',
        description: 'Seu bolão de futebol online.',
        theme_color: '#0F1A4D', // Usando a cor do tema que estava na minha sugestão
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