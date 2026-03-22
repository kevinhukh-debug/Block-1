// FORGE Service Worker — v12
// Strategy:
//   HTML files  → network-first (always get latest deploy, fall back to cache offline)
//   Assets      → cache-first  (icons, manifest — rarely change)
const CACHE_NAME = 'FORGE-v12';

const HTML_FILES = [
  '/Block-1/',
  '/Block-1/index.html',
  '/Block-1/forge-monday.html',
  '/Block-1/forge-tuesday.html',
  '/Block-1/forge-wednesday.html',
  '/Block-1/forge-thursday.html',
  '/Block-1/forge-friday.html',
  '/Block-1/forge-saturday.html',
  '/Block-1/forge-sunday.html'
];

const ASSET_FILES = [
  '/Block-1/manifest.json',
  '/Block-1/forge-icon-192.png',
  '/Block-1/forge-icon-512.png'
];

const PRECACHE_URLS = HTML_FILES.concat(ASSET_FILES);

// Install — pre-cache everything
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE_URLS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activate — delete old caches, take control immediately
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

function isHtmlRequest(url) {
  var path = new URL(url).pathname;
  return path.endsWith('.html') || path.endsWith('/') || path === '/Block-1';
}

// Fetch
self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  if (isHtmlRequest(event.request.url)) {
    // Network-first for HTML: always try to get fresh version
    // Falls back to cache when offline — app still works at gym
    event.respondWith(
      fetch(event.request).then(function(response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(function() {
        return caches.match(event.request);
      })
    );
  } else {
    // Cache-first for assets (icons, manifest)
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        if (cached) return cached;
        return fetch(event.request).then(function(response) {
          if (response && response.status === 200) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, clone);
            });
          }
          return response;
        });
      })
    );
  }
});
