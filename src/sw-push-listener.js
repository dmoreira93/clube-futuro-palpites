// src/sw-push-listener.js (VERSÃO FINAL COMPATÍVEL COM AUTO-UPDATE)

import { precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

// 🌟 ADIÇÃO 1: Força o novo Service Worker a se instalar imediatamente assim que detectado,
// destruindo a versão antiga em background sem depender do fechamento da aba ou de mensagem manual.
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Adiciona um listener para o evento 'message' (mantido por retrocompatibilidade e segurança)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// self.__WB_MANIFEST é injetado pelo vite-plugin-pwa com a lista de arquivos para cache
precacheAndRoute(self.__WB_MANIFEST || []);

// Garante que o novo Service Worker assuma o controle da página assim que for ativado.
clientsClaim();

// 🌟 ADIÇÃO 2: Garante que, ao ativar, o Service Worker limpe caches antigos do Workbox
// que possam conter referências a arquivos JS antigos (com hashes antigos) da Vercel.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Mantém apenas o cache atual do Workbox e deleta resíduos antigos que causam telas em branco
          if (cacheName && !cacheName.includes(self.registration.scope)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// A lógica de notificação push permanece a mesma e intacta
self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: {
        url: data.url || '/'
    }
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url || '/')
    );
});