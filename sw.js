var CACHE_NAME = 'alchemist-v11';
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

// Listen for skipWaiting message from client
self.addEventListener('message', function(e) {
  if (e.data && e.data.action === 'skipWaiting') {
    self.skipWaiting();
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
        names.filter(function(n) { return n !== CACHE_NAME; })
          .map(function(n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

// Network first, fallback to cache
self.addEventListener('fetch', function(e) {
  e.respondWith(
    fetch(e.request).then(function(res) {
      var clone = res.clone();
      caches.open(CACHE_NAME).then(function(cache) {
        cache.put(e.request, clone);
      });
      return res;
    }).catch(function() {
      return caches.match(e.request);
    })
  );
});
