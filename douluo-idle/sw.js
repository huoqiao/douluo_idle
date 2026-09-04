/* 斗罗大陆·自动修炼 —— Service Worker（离线 App 缓存） */
const CACHE = 'douluo-v3';
const CORE = [
  './', './index.html', './h5.html', './manifest.webmanifest',
  './css/style.css', './js/data.js', './js/engine.js', './js/ui.js',
  './icon-192.png', './icon-512.png', './icon-512-maskable.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE).catch(() => {})).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// 缓存优先 + 后台刷新（stale-while-revalidate）；同源 GET 全部纳入缓存
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(resp => {
        if (resp && resp.ok && resp.type === 'basic') {
          const cp = resp.clone();
          caches.open(CACHE).then(c => c.put(req, cp));
        }
        return resp;
      }).catch(() => hit || caches.match('./index.html'));
      return hit || net;
    })
  );
});
