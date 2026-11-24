// Banco de horas — regras de cálculo (puras, sem banco de dados).
//
// Regras combinadas com a empresa:
//  1. Dias úteis são de segunda a sexta. Neles a pessoa deve cumprir a jornada
//     diária. Sábado e domingo não têm jornada prevista: o que for trabalhado
//     entra inteiro como saldo positivo.
//  2. Dia útil SEM nenhum registro não desconta nada — aparece como
//     "sem registro" para o RH decidir.
//  5. Com turno cadastrado, o previsto de cada dia vem da escala do turno
//     (folga = 0). Sem turno, vale a regra 1 com a jornada diária.
//  6. Feriado e férias: previsto 0 (o que for trabalhado vira saldo positivo).
//     Dia abonado (atestado aprovado): o que faltou não desconta.
//  3. Dia em que faltou registrar a saída conta só os períodos fechados e fica
//     marcado como incompleto, para o RH corrigir.
//  4. O dia de hoje só entra no saldo depois da saída registrada.
import {
  minutosTrabalhados,
  dataLocal,
  horaLocal,
  type MarcacaoLite,
} from "./ponto";
import { emFerias, jornadaDoDia, paraMinutos, type RegrasPessoa } from "./turnos";

/** 0 = domingo … 6 = sábado. */
export const DIAS_UTEIS: readonly number[] = [1, 2, 3, 4, 5];

export type SituacaoDia =
  | "completo" // tem registros e terminou com saída
  | "incompleto" // tem registros, mas faltou a saída
  | "andamento" // é hoje e a pessoa ainda não saiu
  | "sem_registro" // dia útil sem nenhum registro
  | "folga" // dia sem jornada prevista, sem registro
  | "feriado" // feriado da empresa
  | "ferias" // pessoa de férias
  | "abonado" // abono aprovado (atestado etc.)
  | "futuro" // ainda não chegou
  | "antes"; // fora do período da pessoa (antes do 1º registro/admissão, após desligamento)

export interface DiaBanco<M extends MarcacaoLite = MarcacaoLite> {
  /** "AAAA-MM-DD" */
  dia: string;
  /** 0 = domingo … 6 = sábado */
  semana: number;
  util: boolean;
  marcacoes: M[];
  trabalhadoMin: number;
  previstoMin: number;
  saldoMin: number;
  situacao: SituacaoDia;
  /** false = não entra no saldo (sem registro, folga, hoje em andamento…). */
  conta: boolean;
  /** Minutos de atraso na entrada (além da tolerância do turno), se houver turno. */
  atrasoMin: number;
  /** Nome do feriado, quando for feriado. */
  feriado?: string;
}

/** Dia da semana de "AAAA-MM-DD" (independe do fuso do servidor). */
export function diaDaSemana(dia: string): number {
  return new Date(`${dia}T12:00:00Z`).getUTCDay();
}

/** Valida "AAAA-MM"; devolve null se não for um mês válido. */
export function mesValido(mes: string | undefined | null): string | null {
  if (!mes || !/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) return null;
  return mes;
}

/** Soma (ou subtrai) meses de "AAAA-MM". */
export function somarMes(mes: string, n: number): string {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Todos os dias ("AAAA-MM-DD") de um mês "AAAA-MM". */
export function diasDoMes(mes: string): string[] {
  const [y, m] = mes.split("-").map(Number);
  const total = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return Array.from(
    { length: total },
    (_, i) => `${mes}-${String(i + 1).padStart(2, "0")}`,
  );
}

/** Início e fim (ISO) de um mês no horário de Brasília. */
export function limitesDeMes(mes: string): { inicio: string; fim: string } {
  const dias = diasDoMes(mes);
  return {
    inicio: new Date(`${dias[0]}T00:00:00.000-03:00`).toISOString(),
    fim: new Date(`${dias[dias.length - 1]}T23:59:59.999-03:00`).toISOString(),
  };
}

/** "novembro de 2026" → "Novembro de 2026". */
export function rotuloMes(mes: string): string {
  const s = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(new Date(`${mes}-15T12:00:00Z`));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Agrupa marcações por dia (no horário de Brasília), cada dia em ordem. */
export function agruparPorDia<M extends MarcacaoLite>(
  marcacoes: M[],
): Map<string, M[]> {
  const mapa = new Map<string, M[]>();
  for (const m of marcacoes) {
    const k = dataLocal(new Date(m.marcado_em));
    const arr = mapa.get(k);
    if (arr) arr.push(m);
    else mapa.set(k, [m]);
  }
  for (const arr of mapa.values()) {
    arr.sort((a, b) => +new Date(a.marcado_em) - +new Date(b.marcado_em));
  }
  return mapa;
}

export interface ContextoCalculo {
  cargaMin: number;
  /** Dia de hoje, "AAAA-MM-DD". */
  hoje: string;
  agora: Date;
  /** Dia do primeiro registro da pessoa (null = nunca registrou). */
  primeiroDia: string | null;
  regras?: RegrasPessoa;
}

/** Calcula um dia do banco de horas. */
export function calcularDia<M extends MarcacaoLite>(
  dia: string,
  marcacoes: M[],
  ctx: ContextoCalculo,
): DiaBanco<M> {
  const semana = diaDaSemana(dia);
  const r = ctx.regras;

  // Jornada prevista "normal" do dia (antes de feriado/férias/abono).
  const escala = r?.escalaEm(dia) ?? null;
  const turnoDoDia = escala ? escala[semana] : null;
  const jornada = escala
    ? jornadaDoDia(turnoDoDia)
    : DIAS_UTEIS.includes(semana)
      ? ctx.cargaMin
      : 0;
  const feriado = r?.feriados.get(dia);
  const ferias = r ? emFerias(dia, r.ferias) : false;
  const abonado = r?.abonos.has(dia) ?? false;
  const util = jornada > 0 && !feriado && !ferias;
  const foraDoContrato = Boolean(
    (r?.admissao && dia < r.admissao) || (r?.desligamento && dia > r.desligamento),
  );

  const base = {
    dia,
    semana,
    util,
    marcacoes,
    trabalhadoMin: 0,
    previstoMin: 0,
    saldoMin: 0,
    conta: false,
    atrasoMin: 0,
    ...(feriado ? { feriado } : {}),
  };

  if (marcacoes.length === 0) {
    const inicio = r?.admissao ?? ctx.primeiroDia;
    let situacao: SituacaoDia;
    if (dia > ctx.hoje) situacao = feriado ? "feriado" : ferias ? "ferias" : "futuro";
    else if (foraDoContrato || !inicio || dia < inicio) situacao = "antes";
    else if (feriado) situacao = "feriado";
    else if (ferias) situacao = "ferias";
    else if (abonado) situacao = "abonado";
    else situacao = util ? "sem_registro" : "folga";
    return { ...base, situacao };
  }

  const trabalhadoMin = minutosTrabalhados(marcacoes, ctx.agora);
  const previstoMin = util ? jornada : 0;
  const saiu = marcacoes[marcacoes.length - 1].tipo === "saida";

  // Atraso: só com turno definido para o dia.
  let atrasoMin = 0;
  const entrada = marcacoes.find((m) => m.tipo === "entrada");
  if (util && turnoDoDia && entrada) {
    const chegou = paraMinutos(horaLocal(entrada.marcado_em));
    const atraso = chegou - paraMinutos(turnoDoDia.entrada);
    if (atraso > (r?.toleranciaMin ?? 10)) atrasoMin = atraso;
  }

  if (dia === ctx.hoje && !saiu) {
    return { ...base, trabalhadoMin, previstoMin, atrasoMin, situacao: "andamento" };
  }
  const saldoBruto = trabalhadoMin - previstoMin;
  return {
    ...base,
    trabalhadoMin,
    previstoMin,
    atrasoMin,
    // Abono: o que faltou não desconta; o que passou continua contando.
    saldoMin: abonado ? Math.max(0, saldoBruto) : saldoBruto,
    situacao: abonado ? "abonado" : saiu ? "completo" : "incompleto",
    conta: true,
  };
}

export interface MesBanco<M extends MarcacaoLite = MarcacaoLite> {
  mes: string;
  dias: DiaBanco<M>[];
  trabalhadoMin: number;
  previstoMin: number;
  saldoMin: number;
  diasTrabalhados: number;
  incompletos: number;
  semRegistro: number;
  atrasos: number;
  /** Saldo acumulado de todos os meses anteriores. */
  anteriorMin: number;
  /** Saldo anterior + saldo do mês. */
  acumuladoMin: number;
  /** Dias de meses anteriores em que faltou a saída (ainda pesam no saldo). */
  semSaidaAnteriores: string[];
}

/**
 * Banco de horas de uma pessoa em um mês.
 * `todas` = todas as marcações da pessoa até o fim do mês consultado (o saldo
 * anterior é calculado a partir delas).
 */
export function calcularMes<M extends MarcacaoLite>(
  mes: string,
  todas: M[],
  cargaMin: number,
  agora: Date = new Date(),
  regras?: RegrasPessoa,
): MesBanco<M> {
  const porDia = agruparPorDia(todas);
  const chaves = [...porDia.keys()].sort();
  const ctx: ContextoCalculo = {
    cargaMin,
    hoje: dataLocal(agora),
    agora,
    primeiroDia: chaves[0] ?? null,
    regras,
  };

  const inicioMes = `${mes}-01`;
  let anteriorMin = 0;
  const semSaidaAnteriores: string[] = [];
  for (const k of chaves) {
    if (k >= inicioMes) break;
    const d = calcularDia(k, porDia.get(k)!, ctx);
    anteriorMin += d.saldoMin;
    if (d.situacao === "incompleto") semSaidaAnteriores.push(k);
  }

  const dias = diasDoMes(mes).map((d) => calcularDia(d, porDia.get(d) ?? [], ctx));
  const contam = dias.filter((d) => d.conta);
  const saldoMin = contam.reduce((a, d) => a + d.saldoMin, 0);

  return {
    mes,
    dias,
    trabalhadoMin: contam.reduce((a, d) => a + d.trabalhadoMin, 0),
    previstoMin: contam.reduce((a, d) => a + d.previstoMin, 0),
    saldoMin,
    diasTrabalhados: dias.filter((d) => d.marcacoes.length > 0).length,
    incompletos: dias.filter((d) => d.situacao === "incompleto").length,
    semRegistro: dias.filter((d) => d.situacao === "sem_registro").length,
    atrasos: dias.filter((d) => d.atrasoMin > 0).length,
    anteriorMin,
    acumuladoMin: anteriorMin + saldoMin,
    semSaidaAnteriores,
  };
}

/** "+2h 15min", "−0h 40min" ou "0h 00min". */
export function formatarSaldo(min: number): string {
  const abs = Math.abs(Math.trunc(min));
  const texto = `${Math.floor(abs / 60)}h ${String(abs % 60).padStart(2, "0")}min`;
  if (min > 0) return `+${texto}`;
  if (min < 0) return `−${texto}`;
  return texto;
}

/** Horas decimais com vírgula, para planilha: 150 min → "2,50". */
export function horasDecimais(min: number): string {
  return (min / 60).toFixed(2).replace(".", ",");
}

/** "HH:MM" com sinal, para planilha: -40 → "-00:40". */
export function horasRelogio(min: number): string {
  const abs = Math.abs(Math.trunc(min));
  const t = `${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
  return min < 0 ? `-${t}` : t;
}
