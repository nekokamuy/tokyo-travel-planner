const CACHE_VERSION = '1.32.0';
const VERSION_LABEL = `v${CACHE_VERSION}`;
const CACHE_NAME = `tokyo-travel-shell-${CACHE_VERSION}`;
const CACHE_PREFIX = 'tokyo-travel-shell-';
const APP_SHELL = ['./', './index.html', './styles.css?v=1.32.0', './script.js?v=1.32.0', './exchange-rate.js', './weather.js?v=1.31.0', './pwa.js?v=1.30.0', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    const oldCacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME);

    await Promise.all(oldCacheKeys.map((key) => caches.delete(key)));
    await self.clients.claim();

    if (oldCacheKeys.length > 0) {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      windows.forEach((client) => client.postMessage({ type: 'UPDATE_READY', version: VERSION_LABEL }));
    }
  })());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;

    if (event.request.mode === 'navigate') {
      const fallback = await caches.match('./index.html');
      if (fallback) return fallback;
    }

    try {
      const response = await fetch(event.request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, response.clone());
      }
      return response;
    } catch {
      return Response.error();
    }
  })());
});
