"use client";

import { createContext, useEffect, useState, type ReactNode } from "react";

interface EventoInstalacao extends Event {
  prompt(): Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const ContextoInstalacao = createContext<{
  instalar: (() => Promise<boolean>) | null;
  instalado: boolean;
  abertoComoApp: boolean;
}>({ instalar: null, instalado: false, abertoComoApp: false });

export function InstalacaoProvider({ children }: { children: ReactNode }) {
  const [evento, setEvento] = useState<EventoInstalacao | null>(null);
  const [instalado, setInstalado] = useState(false);
  const [abertoComoApp, setAbertoComoApp] = useState(false);

  useEffect(() => {
    const navegador = navigator as Navigator & { standalone?: boolean };
    setAbertoComoApp(
      window.matchMedia("(display-mode: standalone)").matches ||
        navegador.standalone === true,
    );

    function guardarPrompt(e: Event) {
      if (!/Android/i.test(navigator.userAgent)) return;
      e.preventDefault();
      setEvento(e as EventoInstalacao);
    }

    function confirmarInstalacao() {
      setInstalado(true);
      setEvento(null);
    }

    // O Chrome pode oferecer a instalação ainda na tela de login.
    window.addEventListener("beforeinstallprompt", guardarPrompt);
    window.addEventListener("appinstalled", confirmarInstalacao);
    return () => {
      window.removeEventListener("beforeinstallprompt", guardarPrompt);
      window.removeEventListener("appinstalled", confirmarInstalacao);
    };
  }, []);

  const instalar = evento
    ? async () => {
        setEvento(null);
        const resposta = await evento.prompt();
        return resposta.outcome === "accepted";
      }
    : null;

  return (
    <ContextoInstalacao.Provider value={{ instalar, instalado, abertoComoApp }}>
      {children}
    </ContextoInstalacao.Provider>
  );
}
