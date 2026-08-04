const C='travel-companion-v2-1-dev1';
const A=['./','./index.html','./assets/app.css','./assets/app.v210.dev.js','./manifest.webmanifest','./public/data/osaka-2026.json','./public/data/hotel.json'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(A))) });
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{if(e.request.url.includes('supabase.co')||e.request.url.includes('open-meteo.com'))return;e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)))});