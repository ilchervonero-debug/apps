const CACHE='del-trazo-al-pixel-v1';
const CORE=[
  '/del-trazo-al-pixel',
  '/del-trazo-al-pixel/index.html',
  '/del-trazo-al-pixel/manifest.webmanifest',
  '/del-trazo-al-pixel/icon.svg',
  '/del-trazo-al-pixel/icon-maskable.svg'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).then(response=>{
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put('/del-trazo-al-pixel',copy));
      return response;
    }).catch(()=>caches.match('/del-trazo-al-pixel')));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
    if(response && response.status===200){
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put(event.request,copy));
    }
    return response;
  })));
});
