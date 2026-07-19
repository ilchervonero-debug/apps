const CACHE = 'sketchvolt-v7';
const ASSETS = [
  '/apps/sketchvolt/',
  '/apps/sketchvolt/index.html',
  '/apps/sketchvolt/manifest.json',
  '/apps/sketchvolt/icon-192.svg'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;
  if (url.includes('googleapis.com') || url.includes('gstatic.com/firebasejs') || url.includes('firebaseio.com') || url.includes('supabase.co') || url.includes('cdnjs.cloudflare.com')) return;
  const req = e.request;
  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  if (isHTML) {
    e.respondWith(fetch(req).then(res => { caches.open(CACHE).then(c => c.put(req, res.clone())); return res; }).catch(() => caches.match(req).then(r => r || caches.match('/apps/sketchvolt/index.html'))));
  } else {
    e.respondWith(caches.match(req).then(r => { const fresh = fetch(req).then(res => { if (res.ok) caches.open(CACHE).then(c => c.put(req, res.clone())); return res; }).catch(() => r); return r || fresh; }));
  }
});
