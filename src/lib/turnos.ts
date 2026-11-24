// Turnos de trabalho, feriados, férias e abonos — regras puras (sem banco).

/** Um dia da escala do turno. null na escala = folga. */
export interface DiaTurno {
  entrada: string; // "HH:MM"
  saida: string; // "HH:MM"
  intervalo: number; // minutos
}

/** 7 posições: 0 = domingo … 6 = sábado. */
export type Escala = (DiaTurno | null)[];

export interface Turno {
  id: string;
  nome: string;
  escala: Escala;
  tolerancia_min: number;
}

export const NOMES_SEMANA = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];
export const SIGLAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function paraMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Minutos de trabalho previstos num dia do turno (vira a noite se preciso). */
export function jornadaDoDia(d: DiaTurno | null | undefined): number {
  if (!d) return 0;
  let total = paraMinutos(d.saida) - paraMinutos(d.entrada);
  if (total <= 0) total += 1440; // turno da noite (ex.: 22:00 → 06:00)
  return Math.max(0, total - Math.max(0, d.intervalo || 0));
}

/** Valida e normaliza a escala vinda do banco ou de um formulário. */
export function escalaValida(bruto: unknown): Escala | null {
  if (!Array.isArray(bruto) || bruto.length !== 7) return null;
  const hora = /^([01]\d|2[0-3]):[0-5]\d$/;
  const out: Escala = [];
  for (const d of bruto) {
    if (d === null) {
      out.push(null);
      continue;
    }
    const x = d as Partial<DiaTurno>;
    if (!x || typeof x.entrada !== "string" || typeof x.saida !== "string") return null;
    if (!hora.test(x.entrada) || !hora.test(x.saida)) return null;
    const intervalo = Math.round(Number(x.intervalo ?? 0));
    if (!Number.isFinite(intervalo) || intervalo < 0 || intervalo > 600) return null;
    out.push({ entrada: x.entrada, saida: x.saida, intervalo });
  }
  return out;
}

/** "Seg a Sex · 08:00–17:00" — resumo legível de uma escala. */
export function resumoEscala(escala: Escala): string {
  const grupos: { de: number; ate: number; chave: string; d: DiaTurno }[] = [];
  // Começa na segunda para "Seg a Sex" sair em ordem natural.
  for (const i of [1, 2, 3, 4, 5, 6, 0]) {
    const d = escala[i];
    if (!d) continue;
    const chave = `${d.entrada}-${d.saida}-${d.intervalo}`;
    const ult = grupos[grupos.length - 1];
    const seguido = ult && ((ult.ate + 1) % 7 === i);
    if (ult && ult.chave === chave && seguido) ult.ate = i;
    else grupos.push({ de: i, ate: i, chave, d });
  }
  if (grupos.length === 0) return "Sem dias de trabalho";
  return grupos
    .map((g) => {
      const dias =
        g.de === g.ate
          ? SIGLAS_SEMANA[g.de]
          : `${SIGLAS_SEMANA[g.de]} a ${SIGLAS_SEMANA[g.ate]}`;
      return `${dias} ${g.d.entrada}–${g.d.saida}`;
    })
    .join(" · ");
}

/** Jornada semanal total, em minutos. */
export function jornadaSemanal(escala: Escala): number {
  return escala.reduce((a, d) => a + jornadaDoDia(d), 0);
}

/** Escala padrão a partir de uma carga diária antiga: seg–sex. */
export function escalaPadrao(cargaMin: number): Escala {
  const intervalo = cargaMin > 360 ? 60 : 15;
  const fim = 8 * 60 + cargaMin + intervalo;
  const saida = `${String(Math.floor(fim / 60) % 24).padStart(2, "0")}:${String(fim % 60).padStart(2, "0")}`;
  const d: DiaTurno = { entrada: "08:00", saida, intervalo };
  return [null, d, d, d, d, d, null];
}

/**
 * Tudo que muda o "previsto" de cada dia de uma pessoa. Ausente = regras
 * antigas (segunda a sexta, jornada diária fixa).
 */
export interface RegrasPessoa {
  /** Escala vigente num dia (considera o turno programado). */
  escalaEm: (dia: string) => Escala | null;
  /** Dia → nome do feriado. */
  feriados: Map<string, string>;
  /** Períodos de férias, "AAAA-MM-DD" inclusive. */
  ferias: { inicio: string; fim: string }[];
  /** Dias abonados (solicitação de abono aprovada). */
  abonos: Set<string>;
  /** Antes da admissão / depois do desligamento o dia não existe para a pessoa. */
  admissao: string | null;
  desligamento: string | null;
  toleranciaMin: number;
}

export interface FuncionarioRegras {
  turno_id: string | null;
  turno_programado_id: string | null;
  turno_programado_em: string | null;
  data_admissao: string | null;
  desligado_em: string | null;
}

/** Monta as regras de uma pessoa a partir dos dados do banco. */
export function montarRegras(
  f: FuncionarioRegras,
  turnos: Map<string, Turno>,
  feriados: Map<string, string>,
  ferias: { inicio: string; fim: string }[],
  abonos: Set<string>,
): RegrasPessoa | undefined {
  const atual = f.turno_id ? turnos.get(f.turno_id) : undefined;
  const programado = f.turno_programado_id
    ? turnos.get(f.turno_programado_id)
    : undefined;
  return {
    escalaEm: (dia) => {
      if (programado && f.turno_programado_em && dia >= f.turno_programado_em) {
        return programado.escala;
      }
      return atual?.escala ?? null;
    },
    feriados,
    ferias,
    abonos,
    admissao: f.data_admissao,
    desligamento: f.desligado_em,
    toleranciaMin: atual?.tolerancia_min ?? 10,
  };
}

export function emFerias(dia: string, ferias: { inicio: string; fim: string }[]): boolean {
  return ferias.some((p) => dia >= p.inicio && dia <= p.fim);
}
