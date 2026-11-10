"use client";

// Gráfico de colunas em SVG, sem biblioteca.
// Segue as regras de leitura: colunas finas (até 24 px) com topo arredondado,
// grade em fios sólidos e discretos, um eixo só, detalhes ao passar o mouse
// (ou com as setas do teclado) e uma tabela equivalente para leitor de tela.
import { useEffect, useRef, useState } from "react";

export interface Coluna {
  /** Rótulo do eixo X (ex.: "10" ou "08:00"). */
  rotulo: string;
  valor: number;
  /** Valor de referência (ex.: previsto) — desenhado como linha. */
  referencia?: number;
  /** Texto do detalhe ao passar o mouse. */
  dica: { titulo: string; linhas: { nome: string; valor: string; tipo?: "serie" | "ref" }[] };
  /** Rótulo do eixo mais apagado (ex.: fim de semana). */
  apagado?: boolean;
}

const COR = {
  serie: "#0E4F5E",
  serieAtiva: "#0A3D49",
  ref: "#8B9498",
  grade: "#E9E5DD",
  eixo: "#636E73",
  faixa: "#F1EEE8",
};

const M = { topo: 10, direita: 8, base: 26, esquerda: 40 };

/**
 * Arredonda o máximo do eixo para um número "limpo" logo acima do maior valor,
 * escolhido para que as 4 divisões também sejam redondas (ex.: 53 → 60).
 */
const DEGRAUS = [1, 1.2, 1.6, 2, 2.4, 3, 4, 5, 6, 8, 10];
function tetoLimpo(v: number): number {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (DEGRAUS.find((d) => d >= n - 1e-9) ?? 10) * p;
}

export function GraficoColunas({
  dados,
  eixo,
  nomeSerie,
  nomeReferencia,
  altura = 260,
  vazio,
  destaque,
}: {
  dados: Coluna[];
  /** "horas": 10h, 20h… · "inteiro": 1, 2, 3… */
  eixo: "horas" | "inteiro";
  nomeSerie: string;
  nomeReferencia?: string;
  altura?: number;
  /** Mensagem quando não há nenhum valor. */
  vazio: string;
  /** Índice da coluna a destacar no eixo (ex.: hoje). */
  destaque?: number;
}) {
  const caixa = useRef<HTMLDivElement>(null);
  const [largura, setLargura] = useState(0);
  const [ativo, setAtivo] = useState<number | null>(null);

  useEffect(() => {
    const el = caixa.current;
    if (!el) return;
    const medir = () => setLargura(el.clientWidth);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const semDados = dados.every((d) => d.valor <= 0);
  const temRef = Boolean(nomeReferencia) && dados.some((d) => (d.referencia ?? 0) > 0);

  const bruto = Math.max(
    ...dados.map((d) => Math.max(d.valor, d.referencia ?? 0)),
    0,
  );
  // Contagens: o máximo é múltiplo de 4, para as divisões serem inteiras.
  const max =
    eixo === "inteiro"
      ? Math.max(4, Math.ceil(tetoLimpo(bruto) / 4) * 4)
      : tetoLimpo(bruto);
  const marcas = [0, 1, 2, 3, 4].map((i) => (max / 4) * i);
  const fmtEixo = (v: number) => {
    const n = Number.isInteger(v) ? String(v) : v.toFixed(1).replace(".", ",");
    return eixo === "horas" ? `${n}h` : n;
  };

  const w = Math.max(0, largura - M.esquerda - M.direita);
  const h = altura - M.topo - M.base;
  const n = dados.length;
  const banda = n > 0 ? w / n : 0;
  const larguraBarra = Math.max(2, Math.min(24, banda - 2));
  const y = (v: number) => M.topo + h - (v / max) * h;
  const xBanda = (i: number) => M.esquerda + i * banda;
  // Quantos rótulos cabem lado a lado sem colidir.
  const passo = Math.max(1, Math.ceil((n * 30) / Math.max(1, w)));

  function barra(i: number, v: number): string {
    const x = xBanda(i) + (banda - larguraBarra) / 2;
    const base = y(0);
    const topo = Math.min(y(v), base - 1); // valor > 0 sempre aparece
    const r = Math.min(4, larguraBarra / 2, base - topo);
    return `M${x},${base}V${topo + r}Q${x},${topo} ${x + r},${topo}H${x + larguraBarra - r}Q${x + larguraBarra},${topo} ${x + larguraBarra},${topo + r}V${base}Z`;
  }

  // Linha de referência em degraus, só onde há valor.
  let caminhoRef = "";
  if (temRef) {
    let aberto = false;
    dados.forEach((d, i) => {
      const r = d.referencia ?? 0;
      if (r <= 0) {
        aberto = false;
        return;
      }
      const x0 = xBanda(i) + 1;
      const x1 = xBanda(i + 1) - 1;
      caminhoRef += `${aberto ? "L" : "M"}${x0},${y(r)}L${x1},${y(r)}`;
      aberto = true;
    });
  }

  const d = ativo !== null ? dados[ativo] : null;
  const dicaX =
    ativo !== null
      ? Math.min(Math.max(xBanda(ativo) + banda / 2, 116), Math.max(116, largura - 116))
      : 0;
  const dicaY =
    d !== null ? Math.max(M.topo, y(Math.max(d.valor, d.referencia ?? 0)) - 10) : 0;

  function tecla(e: React.KeyboardEvent) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    setAtivo((a) => {
      const de = a ?? destaque ?? 0;
      return Math.min(n - 1, Math.max(0, de + (e.key === "ArrowRight" ? 1 : -1)));
    });
  }

  return (
    <div className="min-w-0">
      {temRef && (
        <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-2">
          <li className="flex items-center gap-2">
            <span
              aria-hidden
              className="h-2.5 w-2.5 rounded-sm"
              style={{ background: COR.serie }}
            />
            {nomeSerie}
          </li>
          <li className="flex items-center gap-2">
            <span
              aria-hidden
              className="h-0.5 w-4 rounded-full"
              style={{ background: COR.ref }}
            />
            {nomeReferencia}
          </li>
        </ul>
      )}

      <div
        ref={caixa}
        className="relative w-full min-w-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        style={{ height: altura }}
        tabIndex={semDados ? -1 : 0}
        role="group"
        aria-label={`${nomeSerie}. Use as setas esquerda e direita para ver cada valor.`}
        onKeyDown={tecla}
        onFocus={() => setAtivo((a) => a ?? destaque ?? 0)}
        onBlur={() => setAtivo(null)}
        onPointerLeave={() => setAtivo(null)}
      >
        {largura > 0 && (
          <svg
            width={largura}
            height={altura}
            aria-hidden
            className="absolute left-0 top-0 block"
          >
            {/* Grade e eixo Y */}
            {marcas.map((v, i) => (
              <g key={i}>
                <line
                  x1={M.esquerda}
                  x2={largura - M.direita}
                  y1={y(v)}
                  y2={y(v)}
                  stroke={i === 0 ? "#CBC5BA" : COR.grade}
                  strokeWidth={1}
                />
                <text
                  x={M.esquerda - 8}
                  y={y(v)}
                  dy="0.32em"
                  textAnchor="end"
                  fontSize={11}
                  fill={COR.eixo}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {fmtEixo(v)}
                </text>
              </g>
            ))}

            {/* Faixa da coluna em foco */}
            {ativo !== null && !semDados && (
              <rect
                x={xBanda(ativo)}
                y={M.topo}
                width={banda}
                height={h}
                fill={COR.faixa}
              />
            )}

            {/* Colunas */}
            {dados.map((c, i) =>
              c.valor > 0 ? (
                <path
                  key={i}
                  d={barra(i, c.valor)}
                  fill={i === ativo ? COR.serieAtiva : COR.serie}
                />
              ) : null,
            )}

            {/* Referência */}
            {caminhoRef && (
              <path
                d={caminhoRef}
                fill="none"
                stroke={COR.ref}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}

            {/* Eixo X */}
            {dados.map((c, i) =>
              i % passo === 0 || i === destaque ? (
                <text
                  key={i}
                  x={xBanda(i) + banda / 2}
                  y={altura - 8}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={i === destaque ? 600 : 400}
                  fill={i === destaque ? "#141C1F" : c.apagado ? "#A3A9AC" : COR.eixo}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {c.rotulo}
                </text>
              ) : null,
            )}

            {/* Áreas de toque: a faixa inteira, não só a coluna */}
            {!semDados &&
              dados.map((_, i) => (
                <rect
                  key={i}
                  x={xBanda(i)}
                  y={M.topo}
                  width={banda}
                  height={h + M.base}
                  fill="transparent"
                  onPointerEnter={() => setAtivo(i)}
                  onPointerDown={() => setAtivo(i)}
                />
              ))}
          </svg>
        )}

        {semDados && largura > 0 && (
          <p className="absolute inset-x-10 top-1/2 -translate-y-1/2 text-center text-sm text-ink-3">
            {vazio}
          </p>
        )}

        {d && !semDados && (
          <div
            role="status"
            className="pointer-events-none absolute z-10 w-max min-w-[10rem] max-w-[14rem] -translate-x-1/2 -translate-y-full rounded-lg border border-line bg-surface px-3 py-2 shadow-pop"
            style={{ left: dicaX, top: dicaY }}
          >
            <p className="text-xs text-ink-3">{d.dica.titulo}</p>
            <ul className="mt-1 space-y-0.5">
              {d.dica.linhas.map((l) => (
                <li
                  key={l.nome}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="flex items-center gap-1.5 text-ink-2">
                    {l.tipo && (
                      <span
                        aria-hidden
                        className="h-0.5 w-3 rounded-full"
                        style={{ background: l.tipo === "ref" ? COR.ref : COR.serie }}
                      />
                    )}
                    {l.nome}
                  </span>
                  <span className="whitespace-nowrap font-semibold text-ink">
                    {l.valor}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Mesmos dados em tabela, para leitor de tela */}
      <table className="sr-only">
        <caption>{nomeSerie}</caption>
        <tbody>
          {dados.map((c, i) => (
            <tr key={i}>
              <th scope="row">{c.dica.titulo}</th>
              {c.dica.linhas.map((l) => (
                <td key={l.nome}>
                  {l.nome}: {l.valor}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
