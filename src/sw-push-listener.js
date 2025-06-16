// src/sw-push-listener.js
import { precacheAndRoute } from 'workbox-precaching'

// self.__WB_MANIFEST is injected by the PWA plugin
precacheAndRoute(self.__WB_MANIFEST || [])

self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/pwa-192x192.png', // Ícone que aparece na notificação
    badge: '/pwa-192x192.png', // Ícone para a barra de status (opcional)
    data: {
        url: data.url // URL para abrir ao clicar na notificação
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