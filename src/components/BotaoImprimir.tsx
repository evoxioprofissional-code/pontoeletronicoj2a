"use client";

import { botao } from "./ui";

/** Abre a impressão do navegador (de onde também se salva em PDF). */
export function BotaoImprimir({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={botao("secundario", "md", "print:hidden")}
    >
      {children}
    </button>
  );
}
