// Nome do cache
const CACHE_NAME = "curriculo-express-v1";

// Arquivos essenciais
const ASSETS = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/main.js",
  "./js/resume-generator.js",
  "./js/form-handlers.js",
  "./js/data-storage.js",
  "./js/export-utils.js",
  "./js/realtime-preview.js",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/maskable-512.png"
];

// Instalação
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Ativação
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Interceptação de requests
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).catch(() =>
          caches.match("./index.html")
        )
      );
    })
  );
});
