const CACHE_NAME = 'guardian-band-v2';
const APP_ASSETS = [
  './',
  './index.html',
  './script.js',
  './leaflet/leaflet.css',
  './leaflet/leaflet.js'
];

// 1. Install: Cache the core UI files immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_ASSETS);
    })
  );
  self.skipWaiting(); // Force the new version to activate immediately
});

// 2. Fetch: The "Smart Cache" logic
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // If the request is for a map tile...
  if (url.includes('/tiles/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // Return from cache if we have it, otherwise fetch and save it
        return cachedResponse || fetch(event.request).then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
  } else {
    // For regular files (HTML/JS), try cache first, then network
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});