// Tipos compartilhados do protótipo j2aponto.
// Tudo aqui é mock/local — nenhuma integração real (backend, câmera, GPS).

export type Screen =
  | "splash"
  | "login"
  | "home"
  | "capture"
  | "confirmation"
  | "history"
  | "profile";

/** Estado do funcionário derivado da sequência de marcações do dia. */
export type Status = "off" | "working" | "break";

/** Os quatro tipos de marcação de um dia de trabalho. */
export type PunchType =
  | "Entrada"
  | "Início Intervalo"
  | "Fim Intervalo"
  | "Saída";

/** Resultado simulado do reconhecimento facial (alternável no painel de demo). */
export type FaceOutcome = "success" | "fail";

export interface PunchRecord {
  type: PunchType;
  /** Segundos desde a meia-noite — base para cálculo de horas. */
  seconds: number;
  /** Rótulo pronto para exibição, ex.: "07:58:12". */
  label: string;
}

export interface DayLog {
  /** Chave do dia no protótipo. */
  id: "today" | "yesterday";
  title: string;
  punches: PunchRecord[];
}
