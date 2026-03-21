// FORGE Service Worker — v8
// Cache-first strategy: gym = offline environment, not network-first
const CACHE_NAME = 'FORGE-v9';
const PRECACHE_URLS = [
  '/Block-1/',
  '/Block-1/index.html',
  '/Block-1/forge-monday.html',
  '/Block-1/forge-tuesday.html',
  '/Block-1/forge-wednesday.html',
  '/Block-1/forge-thursday.html',
  '/Block-1/forge-friday.html',
  '/Block-1/forge-saturday.html',
  '/Block-1/forge-sunday.html',
  '/Block-1/manifest.json',
  '/Block-1/forge-icon-192.png',
  '/Block-1/forge-icon-512.png'
];

// Install — pre-cache all app files
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE_URLS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activate — delete old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch — cache-first, fall back to network
self.addEventListener('fetch', function(event) {
  // Skip non-GET and cross-origin requests
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      // Not in cache — fetch from network and cache it
      return fetch(event.request).then(function(response) {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        var responseClone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseClone);
        });
        return response;
      });
    })
  );
});
