// Очистка старого кеша и отключение Service Worker
self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key))))
  );
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request));
});
