// Service worker de message-me :
//   - garde une copie du site pour l'ouvrir sans réseau (application
//     installée, métro, avion…). Le réseau passe toujours en premier : une
//     nouvelle version du site est prise dès qu'elle est en ligne ;
//   - affiche les notifications (obligatoire sur Android) et ramène sur la
//     bonne conversation quand on clique dessus.
// Les données (Firestore, connexion) ne passent pas par ici : Firestore garde
// lui-même ses copies hors ligne, et ne stocke que des messages chiffrés.

const CACHE = 'message-me-v1';
const SHELL = [
  './', 'index.html', 'style.css', 'main.js', 'e2e.js', 'media.js', 'notify.js', 'calls.js',
  'groupcall.js', 'qr.js', 'firebase-config.js', 'favicon.svg', 'icon-192.png', 'manifest.webmanifest',
];
const SDK = 'https://www.gstatic.com/firebasejs/';
// Même version que SDK dans main.js.
const SDK_FILES = ['firebase-app.js', 'firebase-auth.js', 'firebase-firestore.js']
  .map((f) => SDK + '12.19.0/' + f);

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(SHELL).catch(() => {});
    await Promise.all(SDK_FILES.map((url) => cache.add(new Request(url, { mode: 'cors' })).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const hit = await cache.match(request, { ignoreSearch: request.mode === 'navigate' });
    if (hit) return hit;
    if (request.mode === 'navigate') {
      const page = await cache.match('index.html');
      if (page) return page;
    }
    throw err;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // Le SDK Firebase a une adresse par version : il ne change jamais.
  if (url.href.startsWith(SDK)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (url.origin === self.location.origin && url.pathname.startsWith(new URL(self.registration.scope).pathname)) {
    event.respondWith(networkFirst(request));
  }
});

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
