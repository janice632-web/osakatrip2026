const CACHE_NAME = "travel-companion-v4-0-0-stable1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./assets/app.css",
  "./assets/app.js?v=400-stable1",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./public/data/osaka-2026.json",
  "./public/data/hotel.json",
  "./public/data/day-overrides.json",
  "./public/data/transport.json",
  "./public/data/shopping.json",
  "./public/data/luggage.json",
  "./public/data/tickets.json",
  "./public/data/wishlist.json",
  "./assets/products/biore-athlizm.jpg",
  "./assets/products/elixir-retinol.webp",
  "./assets/products/fancl-mco.webp",
  "./assets/products/lipopeel.webp",
  "./assets/products/melano-cc-premium.jpg",
  "./assets/products/minon-mask.png",
  "./assets/products/skin-aqua.jpg"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if(event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if(url.hostname.includes("supabase.co") || url.hostname.includes("open-meteo.com")) return;

  const isCore =
    event.request.mode === "navigate" ||
    /\/index\.html$/.test(url.pathname) ||
    /\/assets\/app\.(js|css)$/.test(url.pathname);

  if(isCore){
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy=response.clone();
          caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));
          return response;
        })
        .catch(()=>caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      const copy=response.clone();
      caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));
      return response;
    }))
  );
});
