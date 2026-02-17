/* eslint-disable no-restricted-globals */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const CACHE_NAME = 'local-farmers-market-v2';
const OFFLINE_URL = '/offline';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
];

// Initialize Firebase for background messaging (only if configured)
try {
  firebase.initializeApp({
    apiKey: 'placeholder',
    projectId: 'placeholder',
    messagingSenderId: 'placeholder',
    appId: 'placeholder',
  });

  const messaging = firebase.messaging();

  // Handle background FCM messages (data-only or when app is in background)
  messaging.onBackgroundMessage((payload) => {
    const { title, body } = payload.notification || {};
    const data = payload.data || {};

    if (!title) return;

    self.registration.showNotification(title, {
      body: body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      data: { url: data.url || '/orders' },
    });
  });
} catch (e) {
  console.log('Firebase messaging not configured, skipping');
}

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching app shell');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
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

// Fetch event - network first with cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API requests and external URLs
  if (url.pathname.startsWith('/api/') || url.origin !== location.origin) {
    return;
  }

  // For navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached version or offline page
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // For other requests (assets, etc.)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version and update cache in background
        fetch(request).then((response) => {
          if (response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, response);
            });
          }
        });
        return cachedResponse;
      }

      // Fetch from network and cache
      return fetch(request).then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

// Handle notification clicks - focus existing window or open new one
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/orders';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus an existing window and navigate
      for (const client of clientList) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // No existing window, open a new one
      return self.clients.openWindow(url);
    })
  );
});
