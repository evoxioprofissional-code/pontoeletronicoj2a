"use client";

import { useEffect } from "react";

/** Registra o service worker para permitir instalar o app (PWA). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Sem service worker o app segue funcionando (só não instala offline).
      });
    }
  }, []);
  return null;
}
