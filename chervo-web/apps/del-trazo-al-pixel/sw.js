const CACHE='del-trazo-al-pixel-app-v1';
const CORE=[
  '/apps/del-trazo-al-pixel/',
  '/apps/del-trazo-al-pixel/app.html',
  '/apps/del-trazo-al-pixel/manifest.json',
  '/apps/del-trazo-al-pixel/icon-192.svg'
];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
    if(response&&response.status===200){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
    return response;
  }).catch(()=>caches.match('/apps/del-trazo-al-pixel/'))));
});
