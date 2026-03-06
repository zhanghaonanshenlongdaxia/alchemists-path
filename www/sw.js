var CACHE_NAME = 'alchemist-v55';
var HOT_CACHE = 'alchemist-hot-update';
var ASSETS = [
  './',
  './index.html',
  './game.js',
  './style.css',
  './audio.js',
  './sprites.js',
  './tilesheet.png',
  './bgm_cave.mp3',
  './bgm_forest.mp3',
  './bgm_swamp.mp3',
  './bgm_lab.mp3',
  './bgm_boss.mp3'
];

// Listen for messages from client
self.addEventListener('message', function(e) {
  if (e.data && e.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
  // Hot update: store new game.js in hot cache
  if (e.data && e.data.action === 'hotUpdate' && e.data.code) {
    caches.open(HOT_CACHE).then(function(c){
      c.put('./game.js', new Response(e.data.code, {headers:{'Content-Type':'application/javascript'}}));
    });
  }
});

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  // Don't auto-skip waiting, let user decide
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME && n !== HOT_CACHE; })
          .map(function(n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: for game.js check hot cache first, then network, then main cache
self.addEventListener('fetch', function(e) {
  var url = e.request.url;
  var isGameJs = url.indexOf('game.js') !== -1 && url.indexOf('?') === -1;
  if(isGameJs) {
    e.respondWith(
      caches.open(HOT_CACHE).then(function(hc){
        return hc.match('./game.js').then(function(hotRes){
          if(hotRes) return hotRes;
          return fetch(e.request).then(function(res){
            if(res.status===200 && res.type==='basic'){
              var clone=res.clone();
              caches.open(CACHE_NAME).then(function(c){c.put(e.request,clone);});
            }
            return res;
          }).catch(function(){ return caches.match(e.request); });
        });
      })
    );
    return;
  }
  e.respondWith(
    fetch(e.request).then(function(res) {
      if(res.status === 200 && res.type === 'basic') {
        var clone = res.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
      }
      return res;
    }).catch(function() {
      return caches.match(e.request);
    })
  );
});
