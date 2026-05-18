const CACHE = "protocol-v25";
const LOCAL_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/icons/app-icon.svg",
  "./css/style.css",
  "./js/app.js",
  "./js/db.js",
  "./js/protocol.js",
  "./js/checklist.js",
  "./js/diet.js",
  "./js/meal-picker.js",
  "./js/report.js",
  "./js/ui.js",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-512-maskable.png",
];
const OPTIONAL_ASSETS = [
  "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      await cache.addAll(LOCAL_SHELL);
      await Promise.allSettled(OPTIONAL_ASSETS.map((asset) => cache.add(asset)));
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return response;
      });
    }),
  );
});
