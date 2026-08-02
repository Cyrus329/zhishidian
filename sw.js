const CACHE_NAME = 'zsb-knowledge-v56-zero-clean-start';
const CORE_ASSETS = [
  './','./index.html','./memory.html','./notes.html','./mindmap.html',
  './styles.css?v=56','./memory.css?v=56','./notes.css?v=56','./mindmap.css?v=56',
  './app.js?v=56','./memory.js?v=56','./notes.js?v=56','./mindmap.js?v=56','./mindmap-data.js?v=56','./knowledge-data.js?v=56',
  './reset-start.js?v=56zero','./manifest.webmanifest','./icon-192.png','./icon-512.png'
];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(CORE_ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const request=event.request;if(request.method!=='GET')return;const url=new URL(request.url);if(url.origin!==self.location.origin)return;
  const isCore=/\.(?:html|css|js|webmanifest)$/.test(url.pathname)||url.pathname.endsWith('/');
  if(isCore){event.respondWith(fetch(request).then(response=>{if(response&&response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(c=>c.put(request,copy))}return response}).catch(()=>caches.match(request).then(hit=>hit||caches.match('./index.html'))));return}
  event.respondWith(caches.match(request).then(hit=>hit||fetch(request).then(response=>{if(response&&response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(c=>c.put(request,copy))}return response})));
});
