// Feriados nacionais do Brasil (fixos + móveis calculados pela Páscoa).

function pascoa(ano: number): Date {
  // Algoritmo de Meeus/Jones/Butcher (calendário gregoriano).
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(ano, mes - 1, dia));
}

const iso = (d: Date) => d.toISOString().slice(0, 10);
const somarDias = (d: Date, n: number) => new Date(+d + n * 86_400_000);

export interface FeriadoSugerido {
  data: string;
  nome: string;
  /** Ponto facultativo (a empresa decide se folga). */
  facultativo?: boolean;
}

export function feriadosNacionais(ano: number): FeriadoSugerido[] {
  const p = pascoa(ano);
  const lista: FeriadoSugerido[] = [
    { data: `${ano}-01-01`, nome: "Confraternização Universal" },
    { data: iso(somarDias(p, -48)), nome: "Carnaval (segunda)", facultativo: true },
    { data: iso(somarDias(p, -47)), nome: "Carnaval (terça)", facultativo: true },
    { data: iso(somarDias(p, -2)), nome: "Sexta-feira Santa" },
    { data: `${ano}-04-21`, nome: "Tiradentes" },
    { data: `${ano}-05-01`, nome: "Dia do Trabalho" },
    { data: iso(somarDias(p, 60)), nome: "Corpus Christi", facultativo: true },
    { data: `${ano}-09-07`, nome: "Independência do Brasil" },
    { data: `${ano}-10-12`, nome: "Nossa Senhora Aparecida" },
    { data: `${ano}-11-02`, nome: "Finados" },
    { data: `${ano}-11-15`, nome: "Proclamação da República" },
    { data: `${ano}-11-20`, nome: "Dia Nacional de Zumbi e da Consciência Negra" },
    { data: `${ano}-12-25`, nome: "Natal" },
  ];
  return lista.sort((a, b) => a.data.localeCompare(b.data));
}
