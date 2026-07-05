const CACHE_NAME = 'thermapace-v2-cache-v1';
const STATIC_ASSETS = [
  '/thermapace/',
  '/thermapace/index.html',
  '/thermapace/icon-192.png',
  '/thermapace/icon-512.png'
];

const CDN_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800;900&display=swap',
  'https://cdn.jsdelivr.net/npm/d3@7'
];

const WEATHER_CACHE = 'thermapace-weather-v1';
const WEATHER_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME && name !== WEATHER_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Weather API: network-first with short cache
  if (url.hostname === 'api.open-meteo.com') {
    event.respondWith(networkFirstWithTimestamp(request, WEATHER_CACHE, WEATHER_CACHE_DURATION));
    return;
  }

  // Geocoding API: network-first
  if (url.hostname === 'geocoding-api.open-meteo.com') {
    event.respondWith(networkFirst(request));
    return;
  }

  // CDN assets: cache-first (these don't change)
  if (CDN_ASSETS.some(asset => request.url.startsWith(asset.split('?')[0]))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Static assets: cache-first
  event.respondWith(cacheFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    // For navigation requests, serve offline page
    if (request.mode === 'navigate') {
      const offlineCached = await caches.match('/thermapace/offline.html');
      if (offlineCached) return offlineCached;
    }
    return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

async function networkFirstWithTimestamp(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  try {
    const response = await fetch(request);
    if (response.ok) {
      const responseToCache = response.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('x-cached-at', Date.now().toString());
      const timedResponse = new Response(await responseToCache.blob(), {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      cache.put(request, timedResponse);
    }
    return response;
  } catch (e) {
    if (cached) {
      const cachedAt = parseInt(cached.headers.get('x-cached-at') || '0');
      if (Date.now() - cachedAt < maxAge) {
        return cached;
      }
    }
    return new Response('Offline', { status: 503 });
  }
}
