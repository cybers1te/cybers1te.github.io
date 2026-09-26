// Service worker de message-me : il ne met rien en cache. Il sert seulement
// à afficher les notifications (obligatoire sur Android) et à ramener sur la
// bonne conversation quand on clique dessus.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const hash = (event.notification.data && event.notification.data.hash) || '';
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const win = windows.find((w) => w.visibilityState === 'visible') || windows[0];
    if (win) {
      win.postMessage({ type: 'open', hash });
      return win.focus();
    }
    return self.clients.openWindow(self.registration.scope + hash);
  })());
});
