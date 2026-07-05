const CACHE = 'ilme-v12';
const ASSETS = [
  '/apps/ilme/',
  '/apps/ilme/index.html',
  '/apps/ilme/manifest.json',
  '/apps/ilme/icon.svg',
  '/apps/ilme/icon-192.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;
  if (url.includes('firestore.googleapis.com') || url.includes('googleapis.com') || url.includes('gstatic.com/firebasejs')) return; // no cachear Firebase
  const req = e.request;
  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  if (isHTML) {
    // network-first: siempre la última versión si hay internet
    e.respondWith(
      fetch(req).then(res => {
        caches.open(CACHE).then(c => c.put(req, res.clone()));
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('/apps/ilme/index.html')))
    );
  } else {
    // assets: cache-first con refresco en segundo plano
    e.respondWith(
      caches.match(req).then(r => {
        const fresh = fetch(req).then(res => {
          if (res.ok) caches.open(CACHE).then(c => c.put(req, res.clone()));
          return res;
        }).catch(() => r);
        return r || fresh;
      })
    );
  }
});
