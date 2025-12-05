const CACHE_NAME = 'nutgiin-delguur-v1';
const OFFLINE_URL = '/offline.html';

// Only cache essential static assets
const STATIC_ASSETS = [
    '/offline.html',
    '/favicon.ico',
];

// Install event - cache offline page only
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching offline page');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Fetch event - Network first, fallback to offline page for navigation only
self.addEventListener('fetch', (event) => {
    const request = event.request;

    // Skip non-http(s) requests (chrome-extension, etc.)
    if (!request.url.startsWith('http')) {
        return;
    }

    // Skip API requests and external resources
    if (request.url.includes('/api/') ||
        request.url.includes('supabase') ||
        request.url.includes('googleapis') ||
        request.url.includes('gstatic')) {
        return;
    }

    // Only handle navigation requests (page loads)
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .catch(() => {
                    // Only show offline page if network truly fails
                    return caches.match(OFFLINE_URL);
                })
        );
        return;
    }

    // For other requests, just use network (don't cache aggressively)
    // This prevents issues with dynamic content
});
