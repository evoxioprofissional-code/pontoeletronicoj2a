"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Renderiza o conteúdo direto no <body>, por cima de tudo.
 *
 * Telas cheias (câmera, comprovante) ficavam presas dentro da página porque
 * um ancestral tinha animação com transform — e "position: fixed" passa a
 * valer em relação a esse ancestral. Resultado: a barra do topo e a barra de
 * abas cobriam a câmera e escondiam os passos. Também trava a rolagem da
 * página enquanto a tela cheia está aberta.
 */
export function TelaCheia({ children }: { children: ReactNode }) {
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, []);

  if (!montado) return null;
  return createPortal(children, document.body);
}
