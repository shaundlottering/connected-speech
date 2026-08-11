// Minimal service worker for the Connected Speech AAC Board PWA.
// Scope is restricted to /aac-board at registration time (see aac-board.astro).
//
// IMPORTANT: the /aac-board page itself is deliberately NOT cached here.
// Astro builds emit hashed, content-addressed JS/CSS filenames that change on
// every deploy and old ones stop existing on the server — caching the HTML
// document risks serving a page that references assets which no longer exist,
// breaking the entire app. Only truly static, deploy-stable files (the
// manifest and icons) are safe to cache.
//
// Bump CACHE_NAME whenever this list changes so the activate handler purges
// any previously cached (and potentially unsafe) entries.
const CACHE_NAME = 'aac-board-shell-v2';
const APP_SHELL = [
  '/aac-board.webmanifest',
  '/aac-board-icon-192.png',
  '/aac-board-icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !APP_SHELL.includes(url.pathname)) {
    return; // not part of the app shell — let the browser handle it normally
  }

  // Network-first so edits show up immediately; fall back to cache when offline.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
