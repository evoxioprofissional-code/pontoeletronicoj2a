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

/**
 * Intervalo mínimo entre duas marcações do mesmo funcionário. Evita o ponto
 * duplicado por toque duplo / reenvio (ex.: entrada e início de intervalo com
 * segundos de diferença).
 */
export const INTERVALO_MIN_MARCACOES_S = 60;

/** Segundos que ainda faltam para liberar a próxima marcação (0 = liberado). */
export function esperaProximaMarcacao(
  ultimaIso: string | null | undefined,
  agora: Date = new Date(),
): number {
  if (!ultimaIso) return 0;
  const passados = (+agora - +new Date(ultimaIso)) / 1000;
  if (passados < 0) return INTERVALO_MIN_MARCACOES_S;
  return Math.max(0, Math.ceil(INTERVALO_MIN_MARCACOES_S - passados));
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

/**
 * Fuso da operação. O servidor (Vercel/Node) roda em UTC; sem isto, o "dia"
 * virava às 21h no horário de Brasília e marcações noturnas caíam no dia
 * seguinte. O Brasil não tem horário de verão desde 2019 (UTC-3 fixo).
 */
export const FUSO = "America/Sao_Paulo";
const OFFSET = "-03:00";

/** "AAAA-MM-DD" da data no fuso da operação. */
export function dataLocal(base: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(base);
}

/** Início e fim (ISO) de um dia no fuso da operação, para consultas por dia. */
export function limitesDoDia(base: Date): { inicio: string; fim: string } {
  const d = dataLocal(base);
  return {
    inicio: new Date(`${d}T00:00:00.000${OFFSET}`).toISOString(),
    fim: new Date(`${d}T23:59:59.999${OFFSET}`).toISOString(),
  };
}

/** Início e fim (ISO) do mês corrente no fuso da operação. */
export function limitesDoMes(base: Date): { inicio: string; fim: string } {
  const [y, m] = dataLocal(base).split("-").map(Number);
  const ultimoDia = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const mm = String(m).padStart(2, "0");
  return {
    inicio: new Date(`${y}-${mm}-01T00:00:00.000${OFFSET}`).toISOString(),
    fim: new Date(`${y}-${mm}-${ultimoDia}T23:59:59.999${OFFSET}`).toISOString(),
  };
}

/** "HH:MM" no fuso da operação. */
export function horaLocal(iso: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
