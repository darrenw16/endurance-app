// Simple service worker for PWA functionality
const CACHE_NAME = 'endurance-app-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service worker activating...');
  event.waitUntil(self.clients.claim());
});

// Fetch event - basic caching strategy
self.addEventListener('fetch', (event) => {
  // Let the browser handle non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      // If network fails, could implement offline fallback here
      return new Response('Offline mode - please check your connection', {
        status: 503,
        statusText: 'Service Unavailable'
      });
    })
  );
});
