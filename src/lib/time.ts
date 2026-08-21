import type { PunchRecord, PunchType, Status } from "./types";

/** Formata segundos-do-dia como HH:MM:SS. */
export function secondsToLabel(total: number): string {
  const s = Math.max(0, Math.floor(total)) % 86400;
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return [hh, mm, ss].map((n) => String(n).padStart(2, "0")).join(":");
}

/** Segundos-do-dia a partir de um objeto Date. */
export function dateToSeconds(d: Date): number {
  return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
}

/** Constrói um PunchRecord a partir de segundos-do-dia. */
export function makePunch(type: PunchType, seconds: number): PunchRecord {
  return { type, seconds, label: secondsToLabel(seconds) };
}

/**
 * Ordem cíclica das marcações num dia. A próxima marcação é sempre
 * determinística a partir da última — deixa o fluxo previsível na demo.
 */
const CYCLE: PunchType[] = [
  "Entrada",
  "Início Intervalo",
  "Fim Intervalo",
  "Saída",
];

export function nextPunchType(punches: PunchRecord[]): PunchType {
  if (punches.length === 0) return "Entrada";
  const last = punches[punches.length - 1].type;
  const idx = CYCLE.indexOf(last);
  return CYCLE[(idx + 1) % CYCLE.length];
}

export function statusFromPunches(punches: PunchRecord[]): Status {
  if (punches.length === 0) return "off";
  switch (punches[punches.length - 1].type) {
    case "Entrada":
    case "Fim Intervalo":
      return "working";
    case "Início Intervalo":
      return "break";
    case "Saída":
    default:
      return "off";
  }
}

/**
 * Horas efetivamente trabalhadas no dia: soma dos períodos "em turno",
 * descontando intervalos. Um período aberto (sem Saída/Fim) conta até `nowSeconds`.
 */
export function workedSeconds(
  punches: PunchRecord[],
  nowSeconds: number,
): number {
  let total = 0;
  let openStart: number | null = null;
  for (const p of punches) {
    if (p.type === "Entrada" || p.type === "Fim Intervalo") {
      openStart = p.seconds;
    } else if (p.type === "Início Intervalo" || p.type === "Saída") {
      if (openStart !== null) {
        total += Math.max(0, p.seconds - openStart);
        openStart = null;
      }
    }
  }
  if (openStart !== null) {
    total += Math.max(0, nowSeconds - openStart);
  }
  return total;
}

/** Formata uma duração em segundos como "8h 06min". */
export function formatDuration(total: number): string {
  const s = Math.max(0, Math.floor(total));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  return `${hh}h ${String(mm).padStart(2, "0")}min`;
}
