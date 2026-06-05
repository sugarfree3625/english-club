const CACHE_STATIC = 'engclub-static-v7';
const CACHE_API = 'engclub-api-v7';
const FETCH_TIMEOUT = 8000; // 8 секунд максимум ждем ответа

// Хосты, которые не кешируем (ходят напрямую)
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
  return url.protocol === 'chrome-extension:' || url.protocol === 'chrome:';
}

function isApiRequest(url) {
  return url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/');
}

// Фетч с таймаутом — спасает от зависаний
function fetchWithTimeout(request, timeout) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), timeout);
    fetch(request)
      .then(res => { clearTimeout(timer); resolve(res); })
      .catch(err => { clearTimeout(timer); reject(err); });
  });
}

// === УСТАНОВКА ===
self.addEventListener('install', () => {
  self.skipWaiting();
});

// === АКТИВАЦИЯ ===
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_STATIC && key !== CACHE_API)
          .map(key => caches.delete(key))
      )
    )
  );
  e.waitUntil(clients.claim());
});

// === ПЕРЕХВАТ ЗАПРОСОВ ===
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Пропускаем внешние запросы
  if (isExternal(url)) return;

  // Пропускаем расширения Chrome
  if (isChromeExtension(url)) return;

  // Только GET-запросы кешируем
  if (e.request.method !== 'GET') return;

  // --- API запросы: NetworkFirst (с таймаутом) ---
  if (isApiRequest(url)) {
    e.respondWith(
      fetchWithTimeout(e.request, FETCH_TIMEOUT)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_API).then(cache => cache.put(e.request, clone));
          return response;
        })
        .catch(() => {
          return caches.match(e.request).then(cached => {
            return cached || new Response(
              JSON.stringify({ error: 'API offline' }),
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

  // --- Статика: StaleWhileRevalidate ---
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetchWithTimeout(e.request, FETCH_TIMEOUT)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_STATIC).then(cache => cache.put(e.request, clone));
          return response;
        })
        .catch(() => null);

      return cached || fetchPromise;
    })
  );
});