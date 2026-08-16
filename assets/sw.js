const CACHE_NAME = 'zen-v3';
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
    const path = new URL(request.url).pathname;

    if (request.method !== 'GET') {
        return fetch(request);
    }

    if (path.startsWith('/api/')) {
        return handleApiFetch(request);
    }

    return handleAssetFetch(event, request);
}

// Network first
async function handleApiFetch(request) {
    try {
        return await fetch(request);
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) {
            return cached;
        }
        return buildOfflineResponse();
    }
}

// Stale while revalidate
async function handleAssetFetch(event, request) {
    const cached = await caches.match(request);

    if (cached) {
        // waitUntil keeps the worker alive for the refresh without delaying the
        // response — an unawaited fetch can be killed mid-flight by the browser.
        event.waitUntil(revalidate(request));
        return cached;
    }

    try {
        const res = await fetch(request);
        // An expired session redirects to /login and fetch follows it silently,
        // so a "successful" response can be login HTML under the note's URL.
        if (res.ok && res.redirected !== true) {
            event.waitUntil(cacheResponse(request, res.clone()));
        }
        return res;
    } catch (error) {
        if (request.mode === 'navigate' || request.destination === 'document') {
            const index = await caches.match('/') || await caches.match('/assets/index.html');
            if (index) {
                return index;
            }
        }

        return buildOfflineResponse();
    }
}

async function revalidate(request) {
    try {
        const res = await fetch(request);
        if (res.ok && res.redirected !== true) {
            await cacheResponse(request, res);
        }
    } catch (error) {
        // Offline during a background refresh is expected — the cached copy
        // was already served, so there is nothing to recover from.
    }
}

function buildOfflineResponse() {
    return new Response('Offline', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/plain' }
    });
}

async function cacheResponse(request, response) {
    try {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response);
    } catch (error) {
        console.error(`[sw] failed to cache ${request.url}`, error);
    }
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