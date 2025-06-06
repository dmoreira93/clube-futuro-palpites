// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc"; // Mantido o seu plugin react-swc original
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa'; // <-- Importação do PWA adicionada

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Adicionada a propriedade 'base' para PWA ou deploy em subdiretório (como GitHub Pages)
  // Se você for fazer deploy no GitHub Pages, descomente a linha abaixo e use o nome do seu repositório.
  // base: "/clube-futuro-palpites/",

  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    
    // Configuração do PWA adicionada conforme solicitado
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Clube Futuro Palpites',
        short_name: 'Futuro Palpites',
        description: 'Seu bolão de futebol online.',
        theme_color: '#ffffff', // Cor do tema da barra de status no mobile
        background_color: '#ffffff', // Cor de fundo da splash screen
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          // (Opcional, mas recomendado) Adicione um ícone "maskable" para uma melhor experiência no Android
          // O ícone maskable garante que o logo do seu app se adapte a diferentes formatos de ícones.
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    }),

    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));