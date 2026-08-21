// Service worker mínimo — habilita a instalação como PWA (adicionar à tela
// inicial). Estratégia network-first simples; cache offline virá depois.
const CACHE = "j2aponto-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Passa direto para a rede; se falhar, tenta o cache.
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request)),
  );
});
