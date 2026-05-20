// Service worker – cache-first for static assets, network-first for API calls
const CACHE = 'wc2026-v2'; // bump version to invalidate old caches

// Pre-cache app shell routes on install
const PRECACHE = ['/', '/album', '/repetidos', '/intercambio'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))
  );
  // Activate immediately without waiting for existing clients to close
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Remove old cache versions
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin except Supabase
  if (request.method !== 'GET') return;

  // Never cache Next.js build chunks — they are content-addressed and managed
  // by Next.js itself; caching them here causes stale-chunk errors after rebuilds.
  if (url.pathname.startsWith('/_next/static/chunks/') ||
      url.pathname.startsWith('/_next/static/css/')) return;

  // Network-first for Supabase API (always want fresh data)
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: 'offline' }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    return;
  }

  // Cache-first for everything else (Next.js static assets, fonts, etc.)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        // Only cache successful same-origin responses
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
