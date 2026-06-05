const CACHE = 'engclub-v5';

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

function isApi(url) {
  return url.pathname.startsWith('/api/');
}

function isChromeExtension(url) {
  return url.protocol === 'chrome-extension:';
}

// Установка — только сбрасываем старый кеш
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll(['/', '/index.html', '/manifest.json']);
    })
  );
});

// Активация — чистим старые кеши
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE).map(key => caches.delete(key))
      );
    })
  );
  e.waitUntil(clients.claim());
});

// Перехват запросов
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  
  // Пропускаем внешние ресурсы
  if (isExternal(url)) return;
  
  // Пропускаем расширения Chrome
  if (isChromeExtension(url)) return;
  
  // API — только сеть
  if (isApi(url)) {
    e.respondWith(fetch(e.request));
    return;
  }
  
  // Локальные файлы — сеть, потом кеш (НЕ БЛОКИРУЕМ)
  e.respondWith(
    fetch(e.request).then(response => {
      // Кешируем успешные ответы
      if (response && response.status === 200) {
        const clone = response.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
      }
      return response;
    }).catch(() => {
      // Если сети нет — пробуем кеш
      return caches.match(e.request);
    })
  );
});
