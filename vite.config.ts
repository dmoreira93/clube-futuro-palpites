// vite.config.ts - VERSÃO ATUALIZADA

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    VitePWA({
      registerType: 'autoUpdate',
      // --- BLOCO ADICIONADO AQUI ---
      workbox: {
        // Força o novo service worker a se ativar assim que for baixado.
        skipWaiting: true,
        // Faz o service worker recém-ativado tomar o controle da página imediatamente.
        clientsClaim: true,
        // Corrige o warning do build, especificando quais arquivos devem ser cacheados.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}']
      },
      // --- FIM DO BLOCO ADICIONADO ---
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Clube Futuro Palpites',
        short_name: 'Palpites',
        description: 'Bolão da Copa do Mundo de Clubes 2025',
        theme_color: '#0F1A4D',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})