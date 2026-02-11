// public/pwa/sw.js
const CACHE = "sense-cache-v1";
const ASSETS = [
  "/pwa/offline.html",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  e.respondWith(
    fetch(req).catch(() => caches.match(req).then((r) => r || caches.match("/pwa/offline.html")))
  );
});
