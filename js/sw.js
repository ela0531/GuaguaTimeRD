const CACHE_NAME = 'guaguatime-v1';

const ARCHIVOS = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './data/rutas.json',
  './data/condiciones.json',
  './data/sectores.json',
  './data/i18n.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ARCHIVOS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});