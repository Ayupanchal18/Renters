/**
 * Service Worker for offline property browsing
 * Validates: Requirements 6.4
 */

const CACHE_NAME = 'property-app-v2';
const STATIC_CACHE = 'static-v2';
const DYNAMIC_CACHE = 'dynamic-v2';
const IMAGE_CACHE = 'images-v2';

// Static assets to cache immediately (only non-hashed assets)
const STATIC_ASSETS = [
    '/',
    '/manifest.json',
    '/property_image/placeholder.jpg',
    '/property_image/placeholder-user.jpg',
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
    /\/api\/properties$/,
    /\/api\/properties\/search$/,
    /\/api\/properties\/filter$/,
];

// Image patterns to cache
const IMAGE_PATTERNS = [
    /\/property_image\//,
    /\/uploads\/properties\//,
    /\.(jpg|jpeg|png|gif|webp|svg)$/i,
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');

    event.waitUntil(
        Promise.all([
            // Cache static assets
            caches.open(STATIC_CACHE).then((cache) => {
                return cache.addAll(STATIC_ASSETS);
            }),
            // Skip waiting to activate immediately
            self.skipWaiting(),
        ])
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');

    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (
                            cacheName !== STATIC_CACHE &&
                            cacheName !== DYNAMIC_CACHE &&
                            cacheName !== IMAGE_CACHE
                        ) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // Take control of all clients
            self.clients.claim(),
        ])
    );
});

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Handle different types of requests
    if (isStaticAsset(request)) {
        event.respondWith(handleStaticAsset(request));
    } else if (isApiRequest(request)) {
        event.respondWith(handleApiRequest(request));
    } else if (isImageRequest(request)) {
        event.respondWith(handleImageRequest(request));
    } else if (isNavigationRequest(request)) {
        event.respondWith(handleNavigationRequest(request));
    }
});

// Check if request is for static assets
function isStaticAsset(request) {
    const url = new URL(request.url);

    // Skip chrome-extension and other non-http(s) schemes
    if (!url.protocol.startsWith('http')) {
        return false;
    }

    // Only cache manifest.json - let Vite handle JS/CSS with its own hashing
    // This prevents stale CSS issues on refresh
    return url.pathname === '/manifest.json';
}

// Check if request is for API
function isApiRequest(request) {
    const url = new URL(request.url);
    return url.pathname.startsWith('/api/');
}

// Check if request is for images
function isImageRequest(request) {
    const url = new URL(request.url);

    // Skip chrome-extension and other non-http(s) schemes
    if (!url.protocol.startsWith('http')) {
        return false;
    }

    return IMAGE_PATTERNS.some(pattern => pattern.test(url.pathname));
}

// Check if request is navigation
function isNavigationRequest(request) {
    return request.mode === 'navigate';
}

// Handle static assets - Network First strategy to prevent stale CSS
async function handleStaticAsset(request) {
    try {
        // Always try network first for static assets
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.error('Static asset fetch failed:', error);
        // Return cached version only if network fails
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

// Handle API requests - Network First with cache fallback
async function handleApiRequest(request) {
    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            // Cache successful API responses
            if (shouldCacheApiResponse(request)) {
                const cache = await caches.open(DYNAMIC_CACHE);
                cache.put(request, networkResponse.clone());
            }
        }

        return networkResponse;
    } catch (error) {
        console.log('Network failed, trying cache for:', request.url);

        // Try to serve from cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            // Add offline indicator header
            const response = cachedResponse.clone();
            response.headers.set('X-Served-From', 'cache');
            return response;
        }

        // Return offline fallback for property lists
        if (request.url.includes('/api/properties')) {
            return new Response(
                JSON.stringify({
                    items: [],
                    message: 'Offline - No cached data available',
                    offline: true,
                }),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        throw error;
    }
}

// Handle image requests - Cache First with network fallback
async function handleImageRequest(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(IMAGE_CACHE);
            // Only cache images smaller than 5MB
            const contentLength = networkResponse.headers.get('content-length');
            if (!contentLength || parseInt(contentLength) < 5 * 1024 * 1024) {
                cache.put(request, networkResponse.clone());
            }
        }
        return networkResponse;
    } catch (error) {
        console.log('Image fetch failed, trying cache:', request.url);

        // Try cache first
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Return placeholder image for offline
        return caches.match('/property_image/placeholder.jpg');
    }
}

// Handle navigation requests - Network First with offline fallback
async function handleNavigationRequest(request) {
    try {
        const networkResponse = await fetch(request);
        return networkResponse;
    } catch (error) {
        // Return cached index.html for offline navigation
        const cachedResponse = await caches.match('/');
        if (cachedResponse) {
            return cachedResponse;
        }

        // Offline fallback page
        return new Response(
            `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Offline - Property App</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .offline { color: #666; }
          </style>
        </head>
        <body>
          <div class="offline">
            <h1>You're offline</h1>
            <p>Please check your internet connection and try again.</p>
            <button onclick="window.location.reload()">Retry</button>
          </div>
        </body>
      </html>
      `,
            {
                status: 200,
                headers: { 'Content-Type': 'text/html' },
            }
        );
    }
}

// Determine if API response should be cached
function shouldCacheApiResponse(request) {
    const url = new URL(request.url);

    // Cache property lists and search results
    return API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        event.waitUntil(handleBackgroundSync());
    }
});

// Handle background sync
async function handleBackgroundSync() {
    console.log('Background sync triggered');

    // Here you could sync offline actions like:
    // - Favorite/unfavorite properties
    // - Contact requests
    // - Search queries to retry

    try {
        // Example: retry failed requests
        const cache = await caches.open(DYNAMIC_CACHE);
        const requests = await cache.keys();

        // Process any pending offline actions
        // This is where you'd implement offline queue processing

    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// Message handling for cache management
self.addEventListener('message', (event) => {
    const { type, payload } = event.data;

    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;

        case 'CACHE_PROPERTY':
            cacheProperty(payload);
            break;

        case 'CLEAR_CACHE':
            clearCache(payload.cacheType);
            break;

        case 'GET_CACHE_SIZE':
            getCacheSize().then(size => {
                event.ports[0].postMessage({ type: 'CACHE_SIZE', size });
            });
            break;
    }
});

// Cache specific property data
async function cacheProperty(propertyData) {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        const response = new Response(JSON.stringify(propertyData), {
            headers: { 'Content-Type': 'application/json' },
        });
        await cache.put(`/api/properties/${propertyData.id}`, response);
    } catch (error) {
        console.error('Failed to cache property:', error);
    }
}

// Clear specific cache
async function clearCache(cacheType = 'all') {
    try {
        if (cacheType === 'all') {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
        } else {
            await caches.delete(cacheType);
        }
    } catch (error) {
        console.error('Failed to clear cache:', error);
    }
}

// Get cache size information
async function getCacheSize() {
    try {
        const cacheNames = await caches.keys();
        let totalSize = 0;

        for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const requests = await cache.keys();

            for (const request of requests) {
                const response = await cache.match(request);
                if (response) {
                    const blob = await response.blob();
                    totalSize += blob.size;
                }
            }
        }

        return {
            totalSize,
            cacheCount: cacheNames.length,
            formattedSize: formatBytes(totalSize),
        };
    } catch (error) {
        console.error('Failed to calculate cache size:', error);
        return { totalSize: 0, cacheCount: 0, formattedSize: '0 B' };
    }
}

// Format bytes to human readable
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}