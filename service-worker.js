const CACHE_NAME = 'travel-companion-v3-4-2-shopping1';
const APP_SHELL = [
  './',
  './index.html',
  './assets/app.css',
  './assets/app.js?v=300',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './public/data/osaka-2026.json',
  './public/data/hotel.json','./public/data/day-overrides.json',
  './public/data/transport.json',
  './public/data/shopping.json',
  './public/data/luggage.json',
  './public/data/tickets.json',
  './public/data/wishlist.json',
  './assets/products/elixir-retinol.webp',
  './assets/products/biore-athlizm.jpg',
  './assets/products/skin-aqua.jpg',
  './assets/products/minon-mask.png',
  './assets/products/melano-cc-premium.jpg',
  './assets/products/lipopeel.webp',
  './assets/products/fancl-mco.webp'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.hostname.includes('supabase.co') || url.hostname.includes('open-meteo.com')) return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
