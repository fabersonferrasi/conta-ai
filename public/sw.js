const CACHE_NAME = 'conta-ai-shell-v2';
const OFFLINE_FALLBACK = '/offline.html';
const APP_SHELL = [
  '/',
  '/dashboard',
  '/transactions',
  '/reports',
  '/accounts',
  '/cards',
  '/categories',
  '/manifest.json',
  '/icons/icon-180.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/offline.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );

  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

const staleWhileRevalidate = async (request) => {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }

      return response;
    })
    .catch(() => cached);

  return cached || networkPromise;
};

const networkFirst = async (request, fallbackUrl) => {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);

    if (response && response.ok) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    if (fallbackUrl) {
      const fallback = await cache.match(fallbackUrl);
      if (fallback) return fallback;
    }

    throw error;
  }
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, OFFLINE_FALLBACK));
    return;
  }

  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'worker' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.startsWith('/_next/static')
  ) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/_next/data')) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
