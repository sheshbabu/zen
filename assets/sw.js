const CACHE_NAME = 'zen-v1';
const STATIC_ASSETS = [
  '/',
  '/assets/index.html',
  '/assets/bundle.js',
  '/assets/index.css',
  '/assets/reset.css',
  '/assets/notes-editor.css',
  '/assets/github.min.css',
  '/assets/preact.esm.js',
  '/assets/markdown-it.min.js',
  '/assets/highlight.min.js',
  '/assets/markdown-it-task-lists.js'
];

self.addEventListener('install', event => {
    event.waitUntil(handleInstall());
});

self.addEventListener('activate', event => {
    event.waitUntil(handleActivate());
});

self.addEventListener('fetch', event => {
    event.respondWith(handleFetch(event.request));
});

async function handleInstall() {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(STATIC_ASSETS);
    await self.skipWaiting();
}

async function handleActivate() {
    await clearOldCaches();
    await self.clients.claim();
}

async function handleFetch(request) {
    if (request.method !== 'GET') {
        return fetch(request);
    }

    try {
        const res = await fetch(request);
        if (res.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, res.clone());
        }
        return res;
    } catch (error) {
        const res = await caches.match(request);
        if (res) {
            return res;
        }

        if (request.mode === 'navigate' || request.destination === 'document') {
            const index = await caches.match('/') || await caches.match('/assets/index.html');
            if (index) {
                return index;
            }
        }

        return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

async function clearOldCaches() {
    const cacheNames = await caches.keys();
    await Promise.all(
        cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME && cacheName.startsWith('zen-'))
            .map(cacheName => caches.delete(cacheName))
    );
}