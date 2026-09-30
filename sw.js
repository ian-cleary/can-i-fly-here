/* Can I Fly Here? — service worker.
   v4: cache-first app shell (same-origin) incl. embedded airfield data;
   network-first for the reverse-geocode API, with a graceful offline
   fallback the app already handles as "degraded". */
const CACHE = 'can-i-fly-here-v4';
const ASSETS = [
  './',
  './index.html',
  './airports.json',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png',
  './icon-152.png',
  './icon-120.png'
];
const API_HOSTS = ['overpass-api.de', 'api.bigdatacloud.net'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Offline: answer API calls with 503 JSON so the app's fetch logic
   takes its existing graceful "degraded" path (warns, doesn't crash). */
function offlineApiResponse() {
  return new Response(JSON.stringify({ error: 'offline' }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; /* Overpass POSTs go straight to the network */
  const url = new URL(req.url);

  /* Live data APIs: network-first. */
  if (API_HOSTS.indexOf(url.hostname) !== -1) {
    event.respondWith(fetch(req).catch(offlineApiResponse));
    return;
  }

  /* App shell + same-origin: cache-first, then network (runtime-cached),
     then the cached page for navigations when fully offline. */
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (url.origin === self.location.origin && res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
