const CACHE = 'engclub-v4';

// Список доменов, которые НЕ кешируем (пропускаем напрямую)
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

// Проверка: является ли запрос внешним ресурсом
function isExternal(url) {
  return EXTERNAL_HOSTS.some(host => url.hostname.includes(host));
}

// Проверка: является ли запрос API-вызовом
function isApi(url) {
  return url.pathname.startsWith('/api/');
}

// Проверка: расширения Chrome
function isChromeExtension(url) {
  return url.protocol === 'chrome-extension:';
}

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll(['/', '/index.html', '/manifest.json']);
    })
  );
});

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

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  
  // Пропускаем внешние ресурсы (Supabase, CDN, Google Fonts)
  if (isExternal(url)) {
    return; // Не перехватываем — браузер сделает обычный запрос
  }
  
  // Пропускаем расширения Chrome
  if (isChromeExtension(url)) {
    return;
  }
  
  // API-запросы всегда идут в сеть
  if (isApi(url)) {
    e.respondWith(
      fetch(e.request).catch(() => {
        return new Response(JSON.stringify({ error: 'Offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }
  
  // Для локальных ресурсов — кеш, потом сеть
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(response => {
        // Кешируем только успешные ответы
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => {
            cache.put(e.request, clone);
          });
        }
        return response;
      });
    })
  );
});
