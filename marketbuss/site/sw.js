// Service worker « de retrait ». La messagerie publiée avant à cette adresse
// installait un service worker (copie hors ligne) ; le navigateur revient
// vérifier ce fichier, trouve celui-ci, l'installe, et il efface tout puis se
// désinstalle. marketbuss lui-même n'utilise pas de service worker.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) await caches.delete(key);
    await self.registration.unregister();
    for (const client of await self.clients.matchAll({ type: 'window' })) client.navigate(client.url);
  })());
});
