// service-worker.js
const CACHE_NAME = 'endurance-app-v1';
const RUNTIME_CACHE = 'runtime-cache-v1';

// Files to cache for offline functionality
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css',
  '/src/App.css',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching essential files');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('Service Worker installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated successfully');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip caching HEAD requests as they're not supported by cache.put()
  if (request.method !== 'GET') {
    return;
  }

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If online, return the response and update cache
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE)
            .then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => {
          // If offline, serve from cache or fallback to index.html
          return caches.match(request)
            .then((response) => response || caches.match('/index.html'));
        })
    );
    return;
  }

  // Handle API requests and other resources
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            // Serve from cache and update in background
            fetch(request)
              .then((response) => {
                if (response.status === 200 && response.type === 'basic') {
                  const responseClone = response.clone();
                  caches.open(RUNTIME_CACHE)
                    .then((cache) => cache.put(request, responseClone));
                }
              })
              .catch(() => {
                // Network failed, but we have cached version
              });
            return cachedResponse;
          }

          // Not in cache, try network
          return fetch(request)
            .then((response) => {
              if (response.status === 200 && response.type === 'basic') {
                const responseClone = response.clone();
                caches.open(RUNTIME_CACHE)
                  .then((cache) => cache.put(request, responseClone));
              }
              return response;
            })
            .catch(() => {
              // Network failed and no cache
              return new Response('Offline - content not available', {
                status: 503,
                statusText: 'Service Unavailable'
              });
            });
        })
    );
  }
});

// Background sync for race data
self.addEventListener('sync', (event) => {
  if (event.tag === 'race-data-sync') {
    event.waitUntil(syncRaceData());
  }
});

// Sync race data when back online
async function syncRaceData() {
  try {
    // Get pending race data from IndexedDB
    const pendingData = await getPendingRaceData();
    
    if (pendingData.length > 0) {
      console.log('Syncing race data:', pendingData.length, 'items');
      
      // Process each pending item
      for (const item of pendingData) {
        try {
          // In a real app, you would sync to a server
          // For now, just mark as synced in local storage
          await markAsSynced(item.id);
        } catch (error) {
          console.error('Failed to sync item:', item.id, error);
        }
      }
      
      console.log('Race data sync completed');
    }
  } catch (error) {
    console.error('Race data sync failed:', error);
  }
}

// Helper functions for race data sync
async function getPendingRaceData() {
  // In a real implementation, this would query IndexedDB
  // For now, return empty array
  return [];
}

async function markAsSynced(itemId) {
  // Mark item as synced in storage
  console.log('Marked as synced:', itemId);
}

// Push notifications (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Race update available',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'race-notification',
      data: data.url || '/',
      actions: [
        {
          action: 'view',
          title: 'View Race',
          icon: '/icon-192.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Endurance App', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data || '/')
    );
  }
});

// Send updates to clients
function notifyClients(message) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage(message);
    });
  });
}

// Notify clients when app is updated
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
