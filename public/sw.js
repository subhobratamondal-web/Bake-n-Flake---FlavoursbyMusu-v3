const CACHE_NAME = 'bakenflake-pwa-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/public/manifest.json',
  'https://i.ibb.co/Xx2kxrrg/LOGO-1.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Helper to perform fetch with timeout
const fetchWithTimeout = (request, timeout = 10000) => {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Network timeout')), timeout)
    )
  ]);
};

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Handle images & GIFs with Stale-While-Revalidate to prevent iOS memory hanging
  if (
    event.request.destination === 'image' ||
    url.includes('weserv.nl') ||
    url.includes('lh3.googleusercontent.com') ||
    url.includes('i.ibb.co') ||
    url.includes('i.pinimg.com') ||
    url.toLowerCase().includes('gif')
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          fetchWithTimeout(event.request, 15000)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, networkResponse);
                });
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        return fetchWithTimeout(event.request, 20000)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            return caches.match(event.request).then(fallback => fallback || new Response('', { status: 404 }));
          });
      })
    );
    return;
  }

  // Default network with fallback to cache
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
