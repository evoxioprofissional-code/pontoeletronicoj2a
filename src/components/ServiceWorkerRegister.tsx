"use client";

import { useEffect } from "react";

const MINHA_VERSAO = process.env.NEXT_PUBLIC_BUILD_ID ?? "dev";
/** Não consulta o servidor mais de uma vez nesse intervalo. */
const INTERVALO_CHECAGEM_MS = 60_000;

/**
 * Registra o service worker (PWA instalável) e mantém o app atualizado.
 *
 * Um app instalado na tela inicial pode ficar aberto por dias com o JavaScript
 * antigo. Depois de um deploy, esse código antigo chama ações do servidor que
 * não existem mais e o "Bater ponto" falha. Aqui, sempre que o app volta para
 * a frente, comparamos a versão com a do servidor e recarregamos se mudou.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => reg.update())
        .catch(() => {
          // Sem service worker o app segue funcionando (só não instala).
        });
    }

    if (MINHA_VERSAO === "dev") return;

    let ultima = 0;
    let cancelado = false;

    async function checar() {
      if (document.visibilityState !== "visible") return;
      const agora = Date.now();
      if (agora - ultima < INTERVALO_CHECAGEM_MS) return;
      ultima = agora;
      try {
        const r = await fetch("/api/versao", { cache: "no-store" });
        if (!r.ok) return;
        const { versao } = (await r.json()) as { versao?: string };
        if (cancelado || !versao || versao === "dev" || versao === MINHA_VERSAO) {
          return;
        }
        // Não interrompe quem está no meio do reconhecimento facial.
        if (document.querySelector("[data-captura]")) {
          ultima = 0;
          return;
        }
        window.location.reload();
      } catch {
        // Sem internet: tenta de novo na próxima vez.
        ultima = 0;
      }
    }

    checar();
    document.addEventListener("visibilitychange", checar);
    window.addEventListener("focus", checar);
    window.addEventListener("online", checar);
    return () => {
      cancelado = true;
      document.removeEventListener("visibilitychange", checar);
      window.removeEventListener("focus", checar);
      window.removeEventListener("online", checar);
    };
  }, []);
  return null;
}
