// Regras de marcação de ponto (compartilhado servidor/cliente).

export type TipoDB = "entrada" | "inicio_intervalo" | "fim_intervalo" | "saida";

export const CICLO: TipoDB[] = [
  "entrada",
  "inicio_intervalo",
  "fim_intervalo",
  "saida",
];

const ROTULOS: Record<TipoDB, string> = {
  entrada: "Entrada",
  inicio_intervalo: "Início Intervalo",
  fim_intervalo: "Fim Intervalo",
  saida: "Saída",
};

export function rotuloTipo(t: TipoDB): string {
  return ROTULOS[t];
}

/** Próximo tipo de marcação, de forma cíclica a partir do último. */
export function proximoTipo(tiposDoDia: TipoDB[]): TipoDB {
  if (tiposDoDia.length === 0) return "entrada";
  const ultimo = tiposDoDia[tiposDoDia.length - 1];
  const i = CICLO.indexOf(ultimo);
  return CICLO[(i + 1) % CICLO.length];
}

export type Status = "off" | "working" | "break";

export function statusDe(tiposDoDia: TipoDB[]): Status {
  if (tiposDoDia.length === 0) return "off";
  switch (tiposDoDia[tiposDoDia.length - 1]) {
    case "entrada":
    case "fim_intervalo":
      return "working";
    case "inicio_intervalo":
      return "break";
    default:
      return "off";
  }
}

export const STATUS_LABEL: Record<Status, string> = {
  off: "Fora de turno",
  working: "Em turno",
  break: "Em intervalo",
};

export interface MarcacaoLite {
  tipo: TipoDB;
  marcado_em: string; // ISO
}

/**
 * Minutos efetivamente trabalhados no dia. Um período aberto (sem saída/início
 * de intervalo) conta até `agora`.
 */
export function minutosTrabalhados(
  marcacoes: MarcacaoLite[],
  agora: Date = new Date(),
): number {
  const ordenadas = [...marcacoes].sort(
    (a, b) => +new Date(a.marcado_em) - +new Date(b.marcado_em),
  );
  let total = 0;
  let inicio: number | null = null;
  for (const m of ordenadas) {
    const t = +new Date(m.marcado_em);
    if (m.tipo === "entrada" || m.tipo === "fim_intervalo") {
      inicio = t;
    } else if (m.tipo === "inicio_intervalo" || m.tipo === "saida") {
      if (inicio !== null) {
        total += Math.max(0, t - inicio);
        inicio = null;
      }
    }
  }
  if (inicio !== null) total += Math.max(0, +agora - inicio);
  return Math.floor(total / 60000);
}

/** Formata minutos como "8h 06min". */
export function formatarMinutos(min: number): string {
  const m = Math.max(0, Math.floor(min));
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}min`;
}

/** Início e fim (ISO) de um dia local, para consultas por dia. */
export function limitesDoDia(base: Date): { inicio: string; fim: string } {
  const ini = new Date(base);
  ini.setHours(0, 0, 0, 0);
  const fim = new Date(base);
  fim.setHours(23, 59, 59, 999);
  return { inicio: ini.toISOString(), fim: fim.toISOString() };
}
