// Férias — cálculo de saldo e vencimento (regra geral da CLT).
//
// A cada 12 meses de trabalho (período aquisitivo) a pessoa ganha 30 dias.
// Esses dias precisam ser tirados nos 12 meses seguintes (período concessivo);
// depois disso as férias estão "vencidas" (a empresa paga em dobro).
// Simplificação: não considera faltas que reduzem os 30 dias (art. 130).

export interface Periodo {
  inicio: string; // "AAAA-MM-DD"
  fim: string;
}

const DIA_MS = 86_400_000;
const d = (s: string) => new Date(`${s}T12:00:00Z`);
const iso = (x: Date) => x.toISOString().slice(0, 10);

export function diasCorridos(p: Periodo): number {
  return Math.round((+d(p.fim) - +d(p.inicio)) / DIA_MS) + 1;
}

function somarAnos(dia: string, n: number): string {
  const x = d(dia);
  x.setUTCFullYear(x.getUTCFullYear() + n);
  return iso(x);
}
function somarDias(dia: string, n: number): string {
  return iso(new Date(+d(dia) + n * DIA_MS));
}

export interface SituacaoFerias {
  /** Períodos aquisitivos completos. */
  periodos: number;
  diasDireito: number;
  diasTirados: number;
  saldo: number;
  /** Último dia para começar as férias do período pendente mais antigo. */
  limite: string | null;
  /** Dias até o limite (negativo = vencidas). */
  diasParaVencer: number | null;
  estado: "sem_admissao" | "em_aquisicao" | "em_dia" | "a_vencer" | "vencida";
  /** Quando completa o próximo período aquisitivo. */
  proximoDireito: string | null;
}

/** Até quantos dias antes do limite consideramos "a vencer". */
export const ALERTA_DIAS = 90;

export function situacaoFerias(
  admissao: string | null,
  ferias: Periodo[],
  hoje: string,
): SituacaoFerias {
  const vazio = {
    periodos: 0,
    diasDireito: 0,
    diasTirados: 0,
    saldo: 0,
    limite: null,
    diasParaVencer: null,
    proximoDireito: null,
  };
  if (!admissao) return { ...vazio, estado: "sem_admissao" };

  let periodos = 0;
  while (somarAnos(admissao, periodos + 1) <= hoje) periodos++;
  // Férias já lançadas (mesmo as futuras) abatem o saldo.
  const diasTirados = ferias.reduce((a, p) => a + diasCorridos(p), 0);
  const diasDireito = periodos * 30;
  const saldo = diasDireito - diasTirados;
  const proximoDireito = somarAnos(admissao, periodos + 1);

  if (periodos === 0) {
    return { ...vazio, diasTirados, saldo, proximoDireito, estado: "em_aquisicao" };
  }
  if (saldo <= 0) {
    return {
      ...vazio,
      periodos,
      diasDireito,
      diasTirados,
      saldo,
      proximoDireito,
      estado: "em_dia",
    };
  }
  // Período pendente mais antigo: os tirados "pagam" os períodos em ordem.
  const quitados = Math.floor(diasTirados / 30);
  const limite = somarDias(somarAnos(admissao, quitados + 2), -1);
  const diasParaVencer = Math.round((+d(limite) - +d(hoje)) / DIA_MS);
  return {
    periodos,
    diasDireito,
    diasTirados,
    saldo,
    limite,
    diasParaVencer,
    proximoDireito,
    estado: diasParaVencer < 0 ? "vencida" : diasParaVencer <= ALERTA_DIAS ? "a_vencer" : "em_dia",
  };
}
