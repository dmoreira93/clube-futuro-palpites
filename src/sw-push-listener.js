// src/sw-push-listener.js (VERSÃO ATUALIZADA E MAIS ROBUSTA)

import { precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

// Adiciona um listener para o evento 'message' para pular a espera
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// self.__WB_MANIFEST é injetado pelo vite-plugin-pwa com a lista de arquivos para cache
precacheAndRoute(self.__WB_MANIFEST || []);

// Garante que o novo Service Worker assuma o controle da página assim que for ativado.
clientsClaim();

// A lógica de notificação push permanece a mesma
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