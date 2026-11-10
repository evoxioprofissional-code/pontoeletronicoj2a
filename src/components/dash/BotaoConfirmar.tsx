"use client";

import type { ReactNode } from "react";

/**
 * Botão de envio que pede confirmação antes — para ações que não têm volta
 * (ex.: excluir uma marcação).
 */
export function BotaoConfirmar({
  pergunta,
  className,
  children,
}: {
  pergunta: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(pergunta)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
