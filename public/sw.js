// Service worker mínimo — habilita a instalação como PWA (adicionar à tela
// inicial). NÃO guarda páginas nem dados em cache: o ponto precisa sempre do
// servidor. Só mostra um aviso claro quando o celular está sem internet.
const VERSAO = "j2aponto-v2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Remove caches de versões anteriores do app.
      const chaves = await caches.keys();
      await Promise.all(chaves.map((c) => caches.delete(c)));
      await self.clients.claim();
    })(),
  );
});

const SEM_INTERNET = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sem internet — j2aponto</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
       background:#14171C;color:#EDEFF2;font-family:system-ui,sans-serif;text-align:center;padding:24px}
  h1{font-size:20px;margin:0 0 8px}
  p{color:#8A93A3;font-size:15px;line-height:1.5;margin:0 0 20px}
  button{background:#F5A623;color:#14171C;border:0;border-radius:16px;padding:14px 24px;
         font-size:16px;font-weight:600}
</style>
</head>
<body>
  <main>
    <h1>Sem conexão com a internet</h1>
    <p>Para bater o ponto é preciso estar conectado.<br>Ligue o Wi-Fi ou os dados móveis e tente de novo.</p>
    <button onclick="location.reload()">Tentar novamente</button>
  </main>
</body>
</html>`;

self.addEventListener("fetch", (event) => {
  // Só intercepta a abertura de páginas; todo o resto vai direto para a rede.
  // (Antes, qualquer requisição que falhasse recebia uma resposta vazia.)
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(
      () =>
        new Response(SEM_INTERNET, {
          status: 503,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }),
    ),
  );
});
