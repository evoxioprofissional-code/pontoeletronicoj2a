// Agrega registros de ponto do mês em séries para o dashboard.
import {
  minutosTrabalhados,
  rotuloTipo,
  type TipoDB,
  type MarcacaoLite,
  dataLocal,
} from "./ponto";

export interface FuncLite {
  id: string;
  nome: string;
  cargo: string | null;
  carga_horaria_min: number | null;
  ativo: boolean;
}
export interface RegLite {
  funcionario_id: string;
  tipo: TipoDB;
  marcado_em: string;
}

export interface Serie {
  nome: string;
  valor: number;
}

function diaLocal(iso: string): string {
  return dataLocal(new Date(iso));
}

function primeiroNomeUltimo(nome: string): string {
  const p = nome.trim().split(/\s+/);
  if (p.length === 1) return p[0];
  return `${p[0]} ${p[p.length - 1]}`;
}

export interface Metricas {
  topHorasExtras: Serie[]; // valor em minutos
  topHorasFaltantes: Serie[];
  bancoPositivo: Serie[];
  bancoNegativo: Serie[]; // valor positivo (módulo)
  distribuicaoPontos: Serie[];
  statusDias: Serie[];
  solicitacoes: Serie[];
  ativos: Serie[];
  pontualidade: Serie[]; // dias com registro
  totais: {
    funcionarios: number;
    ativos: number;
    horasExtrasMin: number;
    horasFaltantesMin: number;
    marcacoesMes: number;
  };
}

export function computarMetricas(
  funcionarios: FuncLite[],
  registros: RegLite[],
  ajustes: { status: string }[],
): Metricas {
  // registros por funcionário → por dia
  const porFunc = new Map<string, RegLite[]>();
  for (const r of registros) {
    const arr = porFunc.get(r.funcionario_id) ?? [];
    arr.push(r);
    porFunc.set(r.funcionario_id, arr);
  }

  const extras: Serie[] = [];
  const faltantes: Serie[] = [];
  const bancoPos: Serie[] = [];
  const bancoNeg: Serie[] = [];
  const pont: Serie[] = [];
  let statusCompleto = 0;
  let statusIncompleto = 0;
  let totalExtra = 0;
  let totalFalta = 0;

  for (const f of funcionarios) {
    const carga = f.carga_horaria_min ?? 480;
    const regs = porFunc.get(f.id) ?? [];
    // agrupa por dia
    const dias = new Map<string, MarcacaoLite[]>();
    for (const r of regs) {
      const k = diaLocal(r.marcado_em);
      const arr = dias.get(k) ?? [];
      arr.push({ tipo: r.tipo, marcado_em: r.marcado_em });
      dias.set(k, arr);
    }
    let extra = 0;
    let falta = 0;
    let saldo = 0;
    for (const [, marc] of dias) {
      const trab = minutosTrabalhados(marc);
      const diff = trab - carga;
      if (diff > 0) extra += diff;
      else falta += -diff;
      saldo += diff;
      // status do dia: completo se nº par de marcações e termina em saída
      const ok =
        marc.length >= 2 &&
        marc.length % 2 === 0 &&
        marc[marc.length - 1].tipo === "saida";
      if (ok) statusCompleto++;
      else statusIncompleto++;
    }
    const nome = primeiroNomeUltimo(f.nome);
    if (extra > 0) extras.push({ nome, valor: extra });
    if (falta > 0) faltantes.push({ nome, valor: falta });
    if (saldo > 0) bancoPos.push({ nome, valor: saldo });
    if (saldo < 0) bancoNeg.push({ nome, valor: -saldo });
    if (dias.size > 0) pont.push({ nome, valor: dias.size });
    totalExtra += extra;
    totalFalta += falta;
  }

  const top = (arr: Serie[]) =>
    [...arr].sort((a, b) => b.valor - a.valor).slice(0, 10);

  // distribuição por tipo
  const cont: Record<TipoDB, number> = {
    entrada: 0,
    inicio_intervalo: 0,
    fim_intervalo: 0,
    saida: 0,
  };
  for (const r of registros) cont[r.tipo]++;
  const distribuicao: Serie[] = (Object.keys(cont) as TipoDB[]).map((t) => ({
    nome: rotuloTipo(t),
    valor: cont[t],
  }));

  // solicitações (ajustes) por status
  const st: Record<string, number> = {
    pendente: 0,
    aprovado: 0,
    rejeitado: 0,
  };
  for (const a of ajustes) if (a.status in st) st[a.status]++;
  const solicitacoes: Serie[] = [
    { nome: "Pendente", valor: st.pendente },
    { nome: "Aprovado", valor: st.aprovado },
    { nome: "Rejeitado", valor: st.rejeitado },
  ];

  const ativos = funcionarios.filter((f) => f.ativo).length;

  return {
    topHorasExtras: top(extras),
    topHorasFaltantes: top(faltantes),
    bancoPositivo: top(bancoPos),
    bancoNegativo: top(bancoNeg),
    distribuicaoPontos: distribuicao,
    statusDias: [
      { nome: "Dias completos", valor: statusCompleto },
      { nome: "Dias incompletos", valor: statusIncompleto },
    ],
    solicitacoes,
    ativos: [
      { nome: "Ativos", valor: ativos },
      { nome: "Inativos", valor: funcionarios.length - ativos },
    ],
    pontualidade: top(pont),
    totais: {
      funcionarios: funcionarios.length,
      ativos,
      horasExtrasMin: totalExtra,
      horasFaltantesMin: totalFalta,
      marcacoesMes: registros.length,
    },
  };
}
