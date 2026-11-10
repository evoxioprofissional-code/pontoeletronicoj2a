// Prova de vida (anti-foto) — lógica pura, sem câmera, para poder ser testada.
//
// Desafio: olhar de frente → virar o rosto para um lado → voltar de frente.
// Uma foto impressa/na tela é plana: ao ser girada, o nariz NÃO se desloca em
// relação aos olhos (tudo encolhe junto). Num rosto real o nariz está à frente
// dos olhos, então ao virar a cabeça ele se desloca — é isso que medimos.
//
// Limite conhecido: roda no aparelho do funcionário, então reduz a fraude por
// foto, mas não substitui uma verificação de vida certificada.

/** Uma leitura do rosto em um quadro do vídeo. */
export interface LeituraRosto {
  /**
   * Deslocamento horizontal do nariz em relação ao centro dos olhos, em fração
   * da distância entre os cantos externos dos olhos. 0 = de frente.
   */
  desvio: number;
  /** Centro e largura da caixa do rosto, em pixels do vídeo. */
  cx: number;
  cy: number;
  largura: number;
}

export type EtapaVida = "frente" | "virar" | "voltar" | "ok";

export interface EstadoVida {
  etapa: EtapaVida;
  /** Quadros seguidos satisfazendo a etapa atual. */
  estaveis: number;
  /** Quadros seguidos sem rosto detectado. */
  perdidos: number;
  ultimo: LeituraRosto | null;
  /** true quando o desafio foi reiniciado neste quadro (rosto sumiu/trocou). */
  reiniciou: boolean;
}

/** |desvio| abaixo disto = olhando de frente. */
export const DESVIO_FRENTE = 0.07;
/** |desvio| acima disto = cabeça virada (~20°). */
export const DESVIO_VIRADO = 0.15;
/** Quadros seguidos exigidos para confirmar "de frente". */
export const QUADROS_ESTAVEIS = 2;
/** Quadros sem rosto tolerados antes de reiniciar o desafio. */
export const QUADROS_PERDIDOS_MAX = 3;
/** Salto máximo do centro do rosto entre quadros (em larguras de rosto). */
export const SALTO_MAX = 0.6;

export function estadoInicial(): EstadoVida {
  return {
    etapa: "frente",
    estaveis: 0,
    perdidos: 0,
    ultimo: null,
    reiniciou: false,
  };
}

function reiniciar(houveProgresso: boolean): EstadoVida {
  return { ...estadoInicial(), reiniciou: houveProgresso };
}

/** Avança o desafio com a leitura de um novo quadro (null = sem rosto). */
export function avancarProva(
  estado: EstadoVida,
  leitura: LeituraRosto | null,
): EstadoVida {
  if (estado.etapa === "ok") return estado;
  const progresso = estado.etapa !== "frente";

  // Rosto sumiu: tolera alguns quadros; depois, recomeça (impede trocar o
  // rosto real por uma foto no meio do desafio).
  if (!leitura) {
    const perdidos = estado.perdidos + 1;
    if (perdidos > QUADROS_PERDIDOS_MAX) return reiniciar(progresso);
    return { ...estado, perdidos, estaveis: 0, reiniciou: false };
  }

  // Rosto "teleportou": provavelmente é outro rosto/foto entrando em cena.
  if (estado.ultimo) {
    const salto = Math.hypot(
      leitura.cx - estado.ultimo.cx,
      leitura.cy - estado.ultimo.cy,
    );
    if (salto > SALTO_MAX * Math.max(leitura.largura, estado.ultimo.largura)) {
      return { ...reiniciar(progresso), ultimo: leitura };
    }
  }

  const base: EstadoVida = {
    ...estado,
    perdidos: 0,
    ultimo: leitura,
    reiniciou: false,
  };
  const abs = Math.abs(leitura.desvio);

  switch (estado.etapa) {
    case "frente": {
      if (abs >= DESVIO_FRENTE) return { ...base, estaveis: 0 };
      const estaveis = estado.estaveis + 1;
      return estaveis >= QUADROS_ESTAVEIS
        ? { ...base, etapa: "virar", estaveis: 0 }
        : { ...base, estaveis };
    }
    case "virar":
      return abs > DESVIO_VIRADO
        ? { ...base, etapa: "voltar", estaveis: 0 }
        : base;
    case "voltar": {
      if (abs >= DESVIO_FRENTE) return { ...base, estaveis: 0 };
      const estaveis = estado.estaveis + 1;
      return estaveis >= QUADROS_ESTAVEIS
        ? { ...base, etapa: "ok", estaveis: 0 }
        : { ...base, estaveis };
    }
  }
  return base;
}

export const INSTRUCAO_VIDA: Record<EtapaVida, string> = {
  frente: "Olhe de frente para a câmera",
  virar: "Vire o rosto devagar para um lado",
  voltar: "Agora volte a olhar de frente",
  ok: "Confirmado! Aguarde…",
};
