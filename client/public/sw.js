const CACHE_NAME = 'childbloom-v2';
const OFFLINE_URL = '/offline.html';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png',
  '/apple-touch-icon.png',
  '/favicon.svg',
];

const GUIDE_URLS = [
  '/guides',
  '/guides/pregnancy',
  '/guides/newborn',
  '/guides/infant',
  '/guides/toddler',
  '/guides/preschool',
  '/guides/early-childhood',
];

// ── Install: pre-cache app shell and guides ───────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll([...STATIC_ASSETS, ...GUIDE_URLS])
    ).then(() => self.skipWaiting())
  );
});

// ── Activate: delete old caches ───────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: routing strategies ─────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // /api/* — Network first, offline fallback JSON
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(
            JSON.stringify({ error: 'offline', message: 'No internet connection' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          );
        })
    );
    return;
  }

  // /guides/* — Cache first (readable offline)
  if (url.pathname.startsWith('/guides')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request).then((res) => {
          caches.open(CACHE_NAME).then((c) => c.put(request, res.clone()));
          return res;
        });
        return cached || networkFetch;
      })
    );
    return;
  }

  // Static assets (JS/CSS/images) — Cache first
  if (
    url.pathname.match(/\.(js|css|png|svg|ico|woff2?|ttf)$/) ||
    url.pathname.startsWith('/assets/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          caches.open(CACHE_NAME).then((c) => c.put(request, res.clone()));
          return res;
        });
      })
    );
    return;
  }

  // Navigation (HTML pages) — Network first, fall back to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(async () => {
          const cached = await caches.match('/index.html');
          return cached || caches.match(OFFLINE_URL);
        })
    );
    return;
  }
});

// ── Background Sync: retry failed weekly check-ins ───────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-weekly-update') {
    event.waitUntil(retrySyncQueue());
  }
});

async function retrySyncQueue() {
  // Notify clients that sync is happening
  const clients = await self.clients.matchAll();
  clients.forEach((client) =>
    client.postMessage({ type: 'SYNC_WEEKLY_UPDATE' })
  );
}

// ── Push notifications ────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'ChildBloom', {
      body: data.body || "Time for this week's check-in",
      icon: '/logo192.png',
      badge: '/logo96.png',
      tag: 'childbloom-notification',
      data: { url: data.url || '/dashboard' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/dashboard')
  );
});
