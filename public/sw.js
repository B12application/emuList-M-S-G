const CACHE_NAME = 'b12-cache-v2';
const urlsToCache = [
    '/titlelogo.png',
    '/logob12.png'
];

// Service Worker Install
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache opened:', CACHE_NAME);
                return cache.addAll(urlsToCache);
            })
    );
    self.skipWaiting();
});

// Service Worker Activate - Delete old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Strategy:
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) return;

    // Skip API requests (Firebase, etc.)
    if (event.request.url.includes('firestore') ||
        event.request.url.includes('firebase') ||
        event.request.url.includes('googleapis') ||
        event.request.url.includes('/api/')) {
        return;
    }

    // For HTML navigation requests, always fetch fresh from network to guarantee latest deployments
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    return caches.match('/') || new Response('Offline', { status: 503 });
                })
        );
        return;
    }

    // For static assets, network first, fallback to cache
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                return caches.match(event.request).then((response) => {
                    if (response) return response;
                    return new Response('Not found', { status: 404 });
                });
            })
    );
});
