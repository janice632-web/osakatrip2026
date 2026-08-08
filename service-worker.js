const APP_VERSION="4.2.4";
const STATIC_CACHE="travel-companion-static-v4-2-4";
const RUNTIME_CACHE="travel-companion-runtime-v4-2-4";
const APP_SHELL=[
  "./",
  "./index.html",
  "./assets/app.css?v=424-spec1",
  "./assets/app.js?v=424-spec1",
  "./manifest.webmanifest?v=424-spec1",
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

self.addEventListener("install",event=>{
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache=>cache.addAll(APP_SHELL))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>![STATIC_CACHE,RUNTIME_CACHE].includes(key)).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("message",event=>{
  if(event.data?.type==="SKIP_WAITING")self.skipWaiting();
});

async function networkFirst(request){
  const cache=await caches.open(RUNTIME_CACHE);
  try{
    const response=await fetch(request);
    if(response && (response.ok || response.type==="opaque"))cache.put(request,response.clone());
    return response;
  }catch{
    return (await cache.match(request)) || (await caches.match(request));
  }
}

async function staleWhileRevalidate(request){
  const cache=await caches.open(RUNTIME_CACHE);
  const cached=await cache.match(request);
  const network=fetch(request).then(response=>{
    if(response && (response.ok || response.type==="opaque"))cache.put(request,response.clone());
    return response;
  }).catch(()=>null);
  return cached || (await network) || (await caches.match(request));
}

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const request=event.request;
  const url=new URL(request.url);

  if(request.destination==="image"){
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if(url.hostname.includes("supabase.co") || url.hostname.includes("open-meteo.com"))return;

  const isCore =
    request.mode==="navigate" ||
    /\/index\.html$/.test(url.pathname) ||
    /\/assets\/app\.(js|css)$/.test(url.pathname) ||
    /\/manifest\.webmanifest$/.test(url.pathname);

  if(isCore){
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});
