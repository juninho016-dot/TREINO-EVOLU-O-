const CACHE_NAME='projeto-evolucao-v21';
const APP_SHELL=['./','./index.html','./manifest.webmanifest'];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache=>cache.addAll(APP_SHELL))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;

  event.respondWith((async()=>{
    const isPage=request.mode==='navigate' || url.pathname.endsWith('/index.html') || url.pathname==='/';
    if(isPage){
      try{
        const response=await fetch(request,{cache:'no-cache'});
        if(response.ok){
          const cache=await caches.open(CACHE_NAME);
          await cache.put(request,response.clone());
        }
        return response;
      }catch(error){
        const fallback=await caches.match(request) || await caches.match('./index.html');
        if(fallback)return fallback;
        throw error;
      }
    }

    const cached=await caches.match(request);
    if(cached)return cached;
    try{
      const response=await fetch(request);
      if(response.ok){
        const cache=await caches.open(CACHE_NAME);
        await cache.put(request,response.clone());
      }
      return response;
    }catch(error){
      throw error;
    }
  })());
});
