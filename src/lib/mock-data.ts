import type { PunchRecord } from "./types";
import { makePunch } from "./time";

/** Dados fictícios do funcionário exibidos no perfil e no login. */
export const EMPLOYEE = {
  name: "Carlos Andrade",
  registration: "04871",
  role: "Operador de Máquinas — Linha 3",
  company: "Indústria Exemplo Ltda",
};

/** Configuração da cerca eletrônica (somente leitura no protótipo). */
export const GEOFENCE = {
  siteName: "Fábrica Central",
  address: "Rod. BR-101, km 42 — Distrito Industrial",
  radiusMeters: 120,
};

const hms = (h: number, m: number, s: number) => h * 3600 + m * 60 + s;

/** Ontem: um dia completo, para demonstrar o histórico fechado. */
export const YESTERDAY_PUNCHES: PunchRecord[] = [
  makePunch("Entrada", hms(7, 56, 3)),
  makePunch("Início Intervalo", hms(12, 0, 11)),
  makePunch("Fim Intervalo", hms(13, 2, 47)),
  makePunch("Saída", hms(17, 4, 29)),
];

/** Hoje: começa com a entrada já batida — funcionário "Em turno". */
export const TODAY_SEED_PUNCHES: PunchRecord[] = [
  makePunch("Entrada", hms(7, 58, 12)),
];
