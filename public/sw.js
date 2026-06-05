const CACHE = 'engclub-v6';

// Список доменов, которые НЕ кешируем
const EXTERNAL_HOSTS = [
  'supabase.co',
  'googleapis.com',
  'gstatic.com',
  'cloudflare.com',
  'jsdelivr.net',
  'fontawesome.com',
  'ui-avatars.com',
  'cdnjs.cloudflare.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

function isExternal(url) {
  return EXTERNAL_HOSTS.some(host => url.hostname.includes(host));
}

function isChromeExtension(url) {
  return url.protocol === 'chrome-extension:';
}

// Установка
self.addEventListener('install', e => {
  self.skipWaiting();
});

// Активация — чистим старые кеши
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key))))
  );
  e.waitUntil(clients.claim());
});

// Перехват запросов — ВСЁ через сеть
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  
  // Пропускаем внешние ресурсы
  if (isExternal(url)) return;
  
  // Пропускаем расширения Chrome
  if (isChromeExtension(url)) return;
  
  // ВСЁ через сеть, без блокировок
  e.respondWith(
    fetch(e.request).catch(() => {
      return caches.match(e.request).then(cached => {
        return cached || new Response('Offline', { status: 503 });
      });
    })
  );
});
