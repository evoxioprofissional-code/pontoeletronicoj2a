// Dados do painel "Visão geral" — tudo calculado a partir das marcações, com
// as mesmas regras do banco de horas (lib/banco.ts). Função pura: testável.
import {
  calcularMes,
  somarMes,
  type MesBanco,
} from "./banco";
import {
  dataLocal,
  horaLocal,
  statusDe,
  type MarcacaoLite,
  type TipoDB,
} from "./ponto";

export interface PessoaPainel {
  id: string;
  nome: string;
  ativo: boolean;
  cargaMin: number;
}

export interface MarcacaoPainel extends MarcacaoLite {
  metodo_verificacao?: string;
  ajustado?: boolean;
}

export type SituacaoHoje = "working" | "break" | "saiu" | "ausente";

export interface PainelDados {
  mes: string;
  ehMesAtual: boolean;
  /** Dia do mês de hoje (1–31), ou null se o mês mostrado não é o atual. */
  diaHoje: number | null;

  equipe: { ativos: number; total: number };

  horas: {
    trabalhadoMin: number;
    /** Mesmo período do mês anterior (até o mesmo dia), para comparar. */
    anteriorMin: number;
    /** Variação em % contra o mesmo período do mês anterior; null = sem base. */
    variacaoPct: number | null;
  };
  banco: { saldoMesMin: number; acumuladoMin: number };
  pendencias: { semSaida: number; semRegistro: number };

  /** Um item por dia do mês. */
  dias: {
    dia: string;
    numero: number;
    util: boolean;
    futuro: boolean;
    trabalhadoMin: number;
    previstoMin: number;
    pessoas: number;
  }[];

  hoje: {
    contagem: Record<SituacaoHoje, number>;
    pessoas: {
      id: string;
      nome: string;
      situacao: SituacaoHoje;
      entrada: string | null;
      desde: string | null;
    }[];
  };

  porPessoa: {
    id: string;
    nome: string;
    ativo: boolean;
    trabalhadoMin: number;
    previstoMin: number;
    saldoMin: number;
    acumuladoMin: number;
    diasTrabalhados: number;
  }[];

  /** Distribuição do horário da primeira entrada de cada dia, em faixas de 10 min. */
  chegadas: { faixa: string; ate: string; quantidade: number }[];
  /** Horário de chegada mais comum (faixa), ou null. */
  chegadaTipica: string | null;

  /**
   * Dias sem saída registrada (do mês e de meses anteriores, que continuam
   * pesando no saldo), do mais recente para o mais antigo.
   */
  semSaida: { id: string; nome: string; dia: string }[];

  ultimas: {
    nome: string;
    tipo: TipoDB;
    marcado_em: string;
    ajustado: boolean;
    manual: boolean;
  }[];
}

const p2 = (n: number) => String(n).padStart(2, "0");

/** Largura (em minutos) de cada faixa do gráfico de chegadas. */
const FAIXA = 10;

/** Minutos desde a meia-noite, no horário de Brasília. */
function minutosDoDia(iso: string): number {
  const [h, m] = horaLocal(iso).split(":").map(Number);
  return h * 60 + m;
}

export function montarPainel(
  pessoas: PessoaPainel[],
  registros: Map<string, MarcacaoPainel[]>,
  mes: string,
  agora: Date = new Date(),
): PainelDados {
  const hoje = dataLocal(agora);
  const ehMesAtual = hoje.startsWith(mes);
  const diaHoje = ehMesAtual ? Number(hoje.slice(8)) : null;

  const calc = pessoas.map((p) => {
    const todas = registros.get(p.id) ?? [];
    return {
      p,
      banco: calcularMes(mes, todas, p.cargaMin, agora) as MesBanco<MarcacaoPainel>,
      anterior: calcularMes(somarMes(mes, -1), todas, p.cargaMin, agora),
    };
  });

  // --- Dias do mês (soma da equipe)
  const nDias = calc[0]?.banco.dias.length ?? 0;
  const dias: PainelDados["dias"] = [];
  for (let i = 0; i < nDias; i++) {
    const ref = calc[0].banco.dias[i];
    let trabalhadoMin = 0;
    let previstoMin = 0;
    let qtd = 0;
    for (const c of calc) {
      const d = c.banco.dias[i];
      if (d.marcacoes.length === 0) continue;
      qtd++;
      trabalhadoMin += d.trabalhadoMin;
      previstoMin += d.previstoMin;
    }
    dias.push({
      dia: ref.dia,
      numero: i + 1,
      util: ref.util,
      futuro: ref.dia > hoje,
      trabalhadoMin,
      previstoMin,
      pessoas: qtd,
    });
  }

  // --- Horas: mês × mesmo período do mês anterior
  const trabalhadoMin = dias.reduce((a, d) => a + d.trabalhadoMin, 0);
  let anteriorMin = 0;
  for (const c of calc) {
    for (const d of c.anterior.dias) {
      if (diaHoje !== null && Number(d.dia.slice(8)) > diaHoje) break;
      if (d.marcacoes.length > 0) anteriorMin += d.trabalhadoMin;
    }
  }
  const variacaoPct =
    anteriorMin > 0
      ? Math.round(((trabalhadoMin - anteriorMin) / anteriorMin) * 100)
      : null;

  // --- Presença de hoje (só pessoas ativas)
  const contagem: Record<SituacaoHoje, number> = {
    working: 0,
    break: 0,
    saiu: 0,
    ausente: 0,
  };
  const pessoasHoje: PainelDados["hoje"]["pessoas"] = [];
  for (const { p } of calc) {
    if (!p.ativo) continue;
    const doDia = (registros.get(p.id) ?? [])
      .filter((m) => dataLocal(new Date(m.marcado_em)) === hoje)
      .sort((a, b) => +new Date(a.marcado_em) - +new Date(b.marcado_em));
    let situacao: SituacaoHoje = "ausente";
    if (doDia.length > 0) {
      const s = statusDe(doDia.map((m) => m.tipo));
      situacao = s === "working" ? "working" : s === "break" ? "break" : "saiu";
    }
    contagem[situacao]++;
    pessoasHoje.push({
      id: p.id,
      nome: p.nome,
      situacao,
      entrada: doDia[0] ? horaLocal(doDia[0].marcado_em) : null,
      desde: doDia.length ? horaLocal(doDia[doDia.length - 1].marcado_em) : null,
    });
  }
  const ordem: SituacaoHoje[] = ["working", "break", "saiu", "ausente"];
  pessoasHoje.sort(
    (a, b) =>
      ordem.indexOf(a.situacao) - ordem.indexOf(b.situacao) ||
      a.nome.localeCompare(b.nome, "pt-BR"),
  );

  // --- Por pessoa
  const porPessoa = calc
    .map(({ p, banco }) => ({
      id: p.id,
      nome: p.nome,
      ativo: p.ativo,
      trabalhadoMin: banco.dias.reduce(
        (a, d) => a + (d.marcacoes.length ? d.trabalhadoMin : 0),
        0,
      ),
      previstoMin: banco.dias.reduce(
        (a, d) => a + (d.marcacoes.length ? d.previstoMin : 0),
        0,
      ),
      saldoMin: banco.saldoMin,
      acumuladoMin: banco.acumuladoMin,
      diasTrabalhados: banco.diasTrabalhados,
    }))
    .filter((x) => x.ativo || x.trabalhadoMin > 0)
    .sort(
      (a, b) =>
        b.trabalhadoMin - a.trabalhadoMin || a.nome.localeCompare(b.nome, "pt-BR"),
    );

  // --- Chegadas: primeira entrada de cada pessoa em cada dia, faixas de 30 min
  const faixas = new Map<number, number>();
  for (const { banco } of calc) {
    for (const d of banco.dias) {
      const primeira = d.marcacoes.find((m) => m.tipo === "entrada");
      if (!primeira) continue;
      const f = Math.floor(minutosDoDia(primeira.marcado_em) / FAIXA) * FAIXA;
      faixas.set(f, (faixas.get(f) ?? 0) + 1);
    }
  }
  const chegadas: PainelDados["chegadas"] = [];
  let chegadaTipica: string | null = null;
  if (faixas.size > 0) {
    const min = Math.min(...faixas.keys());
    const max = Math.max(...faixas.keys());
    let melhor = -1;
    // Mostra pelo menos 9 faixas (abrindo para os dois lados), para o gráfico
    // não virar uma coluna só.
    const ultimo = 1440 - FAIXA;
    let de = min;
    let ate = max;
    while ((ate - de) / FAIXA + 1 < 9 && (de > 0 || ate < ultimo)) {
      if (de > 0) de -= FAIXA;
      if ((ate - de) / FAIXA + 1 < 9 && ate < ultimo) ate += FAIXA;
    }
    const hhmm = (m: number) => `${p2(Math.floor(m / 60))}:${p2(m % 60)}`;
    for (let f = de; f <= ate; f += FAIXA) {
      const q = faixas.get(f) ?? 0;
      const rotulo = hhmm(f);
      chegadas.push({ faixa: rotulo, ate: hhmm(f + FAIXA), quantidade: q });
      if (q > melhor) {
        melhor = q;
        chegadaTipica = rotulo;
      }
    }
  }

  // --- Pendências
  const semSaida = calc
    .flatMap(({ p, banco }) =>
      [
        ...banco.semSaidaAnteriores,
        ...banco.dias.filter((d) => d.situacao === "incompleto").map((d) => d.dia),
      ].map((dia) => ({ id: p.id, nome: p.nome, dia })),
    )
    .sort((a, b) => b.dia.localeCompare(a.dia) || a.nome.localeCompare(b.nome, "pt-BR"));

  // --- Últimas marcações do mês
  const ultimas = calc
    .flatMap(({ p, banco }) =>
      banco.dias.flatMap((d) =>
        d.marcacoes.map((m) => ({
          nome: p.nome,
          tipo: m.tipo,
          marcado_em: m.marcado_em,
          ajustado: Boolean(m.ajustado),
          manual: m.metodo_verificacao === "manual",
        })),
      ),
    )
    .sort((a, b) => b.marcado_em.localeCompare(a.marcado_em))
    .slice(0, 7);

  return {
    mes,
    ehMesAtual,
    diaHoje,
    equipe: {
      ativos: pessoas.filter((p) => p.ativo).length,
      total: pessoas.length,
    },
    horas: { trabalhadoMin, anteriorMin, variacaoPct },
    banco: {
      saldoMesMin: calc.reduce((a, c) => a + c.banco.saldoMin, 0),
      acumuladoMin: calc.reduce((a, c) => a + c.banco.acumuladoMin, 0),
    },
    pendencias: {
      semSaida: semSaida.length,
      semRegistro: calc.reduce(
        (a, c) => a + (c.p.ativo ? c.banco.semRegistro : 0),
        0,
      ),
    },
    dias,
    hoje: { contagem, pessoas: pessoasHoje },
    porPessoa,
    chegadas,
    chegadaTipica,
    semSaida,
    ultimas,
  };
}
