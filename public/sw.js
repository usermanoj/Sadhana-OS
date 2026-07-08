const CACHE_VERSION = 'sadhana-os-v0.3-app-shell';
const APP_SHELL_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icons/icon.svg',
  '/icons/maskable.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key !== CACHE_VERSION)
        .map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  if (shouldBypassCache(event.request, requestUrl)) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached ?? fetch(event.request))
  );
});

function shouldBypassCache(request, requestUrl) {
  if (request.method !== 'GET') {
    return true;
  }

  if (requestUrl.hostname.includes('supabase.co')) {
    return true;
  }

  if (requestUrl.origin !== self.location.origin) {
    return true;
  }

  if (requestUrl.pathname.startsWith('/auth/')) {
    return true;
  }

  return false;
}
