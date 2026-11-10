// Equipe e marcações FICTÍCIAS, só para a pré-visualização de layout
// (/dev/ui, que dá 404 em produção) e para testes. Nunca aparece no app real.
import { dataLocal, type TipoDB } from "./ponto";
import { diaDaSemana } from "./banco";
import type { MarcacaoPainel, PessoaPainel } from "./painel";

const NOMES: [string, number, number][] = [
  // nome, jornada (min), minuto típico de chegada
  ["Ana Beatriz Lopes", 480, 7 * 60 + 52],
  ["Carla Andrade", 360, 8 * 60 + 5],
  ["Diego Fernandes", 480, 7 * 60 + 40],
  ["Jucelino Batista de Araújo", 480, 8 * 60 + 12],
  ["Maurício Coura", 480, 7 * 60 + 58],
  ["Paulo Dantas", 480, 8 * 60 + 25],
  ["Rita Medeiros", 480, 7 * 60 + 47],
  ["Tiago Nóbrega", 440, 8 * 60 + 0],
];

/** Gerador pseudoaleatório fixo: os mesmos dados a cada execução. */
function semente(s: number) {
  let x = s;
  return () => {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    return x / 0x7fffffff;
  };
}

const p2 = (n: number) => String(n).padStart(2, "0");
const iso = (dia: string, min: number) =>
  new Date(`${dia}T${p2(Math.floor(min / 60))}:${p2(min % 60)}:00-03:00`).toISOString();

export function equipeExemplo(agora: Date = new Date()): {
  pessoas: PessoaPainel[];
  registros: Map<string, MarcacaoPainel[]>;
} {
  const hoje = dataLocal(agora);
  const agoraMin =
    Math.floor((+agora - +new Date(`${hoje}T00:00:00-03:00`)) / 60000);
  const pessoas: PessoaPainel[] = NOMES.map(([nome, cargaMin], i) => ({
    id: `ex-${i + 1}`,
    nome,
    cargaMin,
    ativo: i !== 5,
  }));
  const registros = new Map<string, MarcacaoPainel[]>();

  NOMES.forEach(([, carga, chegada], i) => {
    const rnd = semente(97 + i * 31);
    const lista: MarcacaoPainel[] = [];
    const add = (dia: string, tipo: TipoDB, min: number, extra?: Partial<MarcacaoPainel>) =>
      lista.push({ tipo, marcado_em: iso(dia, min), metodo_verificacao: "facial", ajustado: false, ...extra });

    // 45 dias para trás até hoje
    for (let n = 45; n >= 0; n--) {
      const dia = dataLocal(new Date(+agora - n * 86_400_000));
      const semana = diaDaSemana(dia);
      const r = rnd();
      const fimDeSemana = semana === 0 || semana === 6;
      if (fimDeSemana && !(semana === 6 && i % 4 === 0 && r > 0.55)) continue;
      if (!fimDeSemana && r < 0.06) continue; // faltou / folga
      if (i === 5 && n < 12) continue; // pessoa inativa parou de registrar

      const entrada = chegada + Math.round((rnd() - 0.4) * 28);
      const almoco = 12 * 60 + Math.round((rnd() - 0.5) * 20);
      const volta = almoco + 58 + Math.round(rnd() * 12);
      const extra = rnd() > 0.72 ? Math.round(rnd() * 95) : -Math.round(rnd() * 18);
      const saida = fimDeSemana
        ? entrada + 4 * 60
        : entrada + carga + (volta - almoco) + extra;
      const ehHoje = n === 0;

      if (fimDeSemana) {
        add(dia, "entrada", entrada);
        add(dia, "saida", saida);
        continue;
      }
      const passos: [TipoDB, number][] = [
        ["entrada", entrada],
        ["inicio_intervalo", almoco],
        ["fim_intervalo", volta],
        ["saida", saida],
      ];
      // Um dia ou outro sem saída registrada (pendência para o RH).
      const esqueceuSaida = !ehHoje && rnd() < 0.07;
      for (const [tipo, min] of passos) {
        if (ehHoje && min > agoraMin) break;
        if (tipo === "saida" && esqueceuSaida) break;
        add(dia, tipo, min, tipo === "entrada" && rnd() < 0.03 ? { ajustado: true } : undefined);
      }
    }
    registros.set(`ex-${i + 1}`, lista);
  });

  return { pessoas, registros };
}
