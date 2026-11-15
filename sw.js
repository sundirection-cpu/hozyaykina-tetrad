// Офлайн-кэш. Меняйте VERSION после любого изменения файлов.
const VERSION = 'tetrad-v3';
const FILES = ['./','index.html','style.css','sketches.js','library.js','app.js','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png',
  'fonts/caveat-cyr.woff2','fonts/caveat-lat.woff2','fonts/neucha-cyr.woff2','fonts/neucha-lat.woff2'];
self.addEventListener('install', e=>{ e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())); });
self.addEventListener('activate', e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch', e=>{
  if(e.request.method!=='GET') return;
  e.respondWith(fetch(e.request).then(r=>{ const cp=r.clone(); caches.open(VERSION).then(c=>c.put(e.request,cp)); return r; }).catch(()=>caches.match(e.request)));
});
