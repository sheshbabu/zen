const CACHE_NAME = 'zen-v2';
const STATIC_ASSETS = [
    '/',
    '/assets/bundle.js',
    '/assets/bundle.css',
    '/assets/index.css',
    '/assets/reset.css',
    '/assets/github.min.css',
    '/assets/markdown-it.min.js',
    '/assets/highlight.min.js',
    '/assets/site.webmanifest',
    '/assets/favicon-32x32.png',
    '/assets/favicon-16x16.png',
    '/assets/apple-touch-icon.png'
];

self.addEventListener('install', event => {
    event.waitUntil(handleInstall());
});

self.addEventListener('activate', event => {
    event.waitUntil(handleActivate());
});

self.addEventListener('fetch', event => {
    event.respondWith(handleFetch(event));
});

self.addEventListener('message', event => {
    if (event.data?.type === 'CLEAR_CACHE') {
        event.waitUntil(clearAllCaches());
    }
});

async function handleInstall() {
    const cache = await caches.open(CACHE_NAME);

    // cache.addAll() rejects atomically, so one stale filename would silently
    // disable the entire service worker. Cache per-asset so it degrades instead.
    await Promise.all(
        STATIC_ASSETS.map(async asset => {
            try {
                await cache.add(asset);
            } catch (error) {
                console.error(`[sw] failed to precache ${asset}`, error);
            }
        })
    );

    await self.skipWaiting();
}

async function handleActivate() {
    await clearOldCaches();
    await self.clients.claim();
}

async function handleFetch(event) {
    const request = event.request;

    if (request.method !== 'GET') {
        return fetch(request);
    }

    try {
        const res = await fetch(request);
        if (res.ok && isCacheable(request) === true) {
            // waitUntil keeps the worker alive for the write without delaying the
            // response — an unawaited put can be killed mid-flight by the browser.
            event.waitUntil(cacheResponse(request, res.clone()));
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

async function cacheResponse(request, response) {
    try {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response);
    } catch (error) {
        console.error(`[sw] failed to cache ${request.url}`, error);
    }
}

function isCacheable(request) {
    const path = new URL(request.url).pathname;
    return path.startsWith('/api/') !== true;
}

// Unlike clearOldCaches, this drops the current cache too — used on logout.
async function clearAllCaches() {
    const cacheNames = await caches.keys();
    await Promise.all(
        cacheNames
            .filter(cacheName => cacheName.startsWith('zen-'))
            .map(cacheName => caches.delete(cacheName))
    );
}

async function clearOldCaches() {
    const cacheNames = await caches.keys();
    await Promise.all(
        cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME && cacheName.startsWith('zen-'))
            .map(cacheName => caches.delete(cacheName))
    );
}