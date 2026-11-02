const CACHE = "cabas-v16";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/app.css",
  "./js/app.js",
  "./js/config.js",
  "./js/data.js",
  "./js/produits.js",
  "./js/ui.js",
  "./js/illustrations.js",
  "./js/views/liste.js",
  "./js/views/ajouter.js",
  "./js/views/repas.js",
  "./js/views/foyer.js",
  "./js/views/compte.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Réseau d'abord (pour les mises à jour), cache si hors ligne. La police Inter et le client Supabase (esm.sh) sont mis en cache au passage.
// Les appels à Supabase et à api/ ne passent jamais par le cache.
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const tiers = url.host === "fonts.googleapis.com" || url.host === "fonts.gstatic.com" || url.host === "esm.sh";
  if (url.origin !== self.location.origin && !tiers) return;
  if (url.pathname.startsWith("/api/")) return;
  e.respondWith(
    fetch(req, tiers ? undefined : { cache: "no-cache" }).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("./index.html")))
  );
});
