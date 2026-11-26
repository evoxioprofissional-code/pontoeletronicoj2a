// Service worker mínimo — habilita a instalação como PWA (adicionar à tela
// inicial). NÃO guarda páginas nem dados em cache: o ponto precisa sempre do
// servidor. Só mostra um aviso claro quando o celular está sem internet.
const VERSAO = "j2aponto-v4";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Remove caches de versões anteriores do app.
      const chaves = await caches.keys();
      await Promise.all(chaves.map((c) => caches.delete(c)));
      // Pré-carregamento de navegação: o navegador já começa a baixar a
      // página enquanto este service worker acorda (no iPhone, acordá-lo a
      // cada troca de tela atrasava a navegação).
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
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
       background:#F4F6F7;color:#0E1416;font-family:system-ui,sans-serif;text-align:center;padding:24px}
  h1{font-size:20px;margin:0 0 8px}
  p{color:#48545A;font-size:15px;line-height:1.5;margin:0 0 20px}
  button{background:#0B7F8C;color:#FFFFFF;border:0;border-radius:8px;padding:14px 24px;
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
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    (async () => {
      try {
        // Usa a resposta que o navegador já pré-carregou, se houver.
        const pre = await event.preloadResponse;
        if (pre) return pre;
        return await fetch(event.request);
      } catch {
        return new Response(SEM_INTERNET, {
          status: 503,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
    })(),
  );
});
