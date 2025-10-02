/**
 * Service Worker for Baito-AI
 * Provides offline support and caching strategy
 */

const CACHE_NAME = 'baito-ai-v1';
const STATIC_CACHE = 'baito-static-v1';
const DYNAMIC_CACHE = 'baito-dynamic-v1';
const API_CACHE = 'baito-api-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html'
];

// Cache duration in seconds
const CACHE_DURATION = {
  API: 300,        // 5 minutes for API responses
  STATIC: 86400,   // 24 hours for static assets
  DYNAMIC: 3600    // 1 hour for dynamic content
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[ServiceWorker] Caching static assets');
        return cache.addAll(STATIC_ASSETS.filter(asset => asset !== '/offline.html'));
      })
      .catch(err => {
        console.error('[ServiceWorker] Failed to cache static assets:', err);
      })
  );

  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith('baito-') && !name.includes('-v1'))
          .map(name => {
            console.log('[ServiceWorker] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );

  // Take control of all pages immediately
  self.clients.claim();
});

// Helper function to determine cache strategy
function getCacheStrategy(request) {
  const url = new URL(request.url);

  // API requests - Network first, cache fallback
  if (url.pathname.startsWith('/api') || url.hostname.includes('supabase')) {
    return 'network-first';
  }

  // Static assets - Cache first
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff2?)$/)) {
    return 'cache-first';
  }

  // HTML pages - Network first for fresh content
  if (request.mode === 'navigate') {
    return 'network-first';
  }

  // Default strategy
  return 'network-first';
}

// Network first strategy
async function networkFirst(request, cacheName, maxAge) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      // Check if cache is expired
      const cachedDate = new Date(cachedResponse.headers.get('date'));
      const now = new Date();
      const age = (now - cachedDate) / 1000;

      if (age < maxAge) {
        return cachedResponse;
      }
    }

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html') || new Response('Offline', {
        status: 503,
        statusText: 'Service Unavailable'
      });
    }

    throw error;
  }
}

// Cache first strategy
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Return a basic offline response
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const strategy = getCacheStrategy(request);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Chrome extensions
  if (request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        if (strategy === 'cache-first') {
          return await cacheFirst(request, STATIC_CACHE);
        } else {
          const url = new URL(request.url);
          const cacheName = url.pathname.startsWith('/api') ? API_CACHE : DYNAMIC_CACHE;
          const maxAge = url.pathname.startsWith('/api') ? CACHE_DURATION.API : CACHE_DURATION.DYNAMIC;
          return await networkFirst(request, cacheName, maxAge);
        }
      } catch (error) {
        console.error('[ServiceWorker] Fetch failed:', error);

        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/offline.html') || new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        }

        return new Response('Network error', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      }
    })()
  );
});

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-forms') {
    event.waitUntil(syncOfflineForms());
  }
});

async function syncOfflineForms() {
  // Implement offline form sync logic here
  console.log('[ServiceWorker] Syncing offline forms...');
}

// Push notifications support
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'New notification from Baito-AI',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Baito-AI', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});