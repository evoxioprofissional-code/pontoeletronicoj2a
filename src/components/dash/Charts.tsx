// Gráficos do painel, feitos só com HTML/CSS.
// (Antes usava a biblioteca recharts: ~118 kB de JavaScript, rótulos
// inclinados e ilegíveis no celular. Rankings e proporções se leem melhor
// como listas com barras.)
import type { ReactNode } from "react";
import { Cartao } from "@/components/ui";
import { formatarMinutos } from "@/lib/ponto";

interface Serie {
  nome: string;
  valor: number;
}

function Vazio({ children }: { children: ReactNode }) {
  return <p className="py-6 text-sm text-ink-3">{children}</p>;
}

function Moldura({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao?: string;
  children: ReactNode;
}) {
  return (
    <Cartao className="p-5">
      <h3 className="text-[0.9375rem] font-semibold text-ink">{titulo}</h3>
      {descricao && <p className="mt-0.5 text-sm text-ink-3">{descricao}</p>}
      <div className="mt-4">{children}</div>
    </Cartao>
  );
}

/** Ranking: nome, valor e uma barra proporcional ao maior valor. */
export function RankCard({
  titulo,
  descricao,
  data,
  formato = "numero",
  tom = "brand",
  unidade,
  vazio = "Sem dados neste mês.",
  limite = 6,
}: {
  titulo: string;
  descricao?: string;
  data: Serie[];
  formato?: "numero" | "tempo";
  tom?: "brand" | "ok" | "danger";
  unidade?: string;
  vazio?: string;
  limite?: number;
}) {
  const itens = data.filter((d) => d.valor > 0).slice(0, limite);
  const max = Math.max(1, ...itens.map((d) => d.valor));
  const fmt = (v: number) =>
    formato === "tempo"
      ? formatarMinutos(v)
      : `${v}${unidade ? ` ${unidade}` : ""}`;
  const cor =
    tom === "ok" ? "bg-ok" : tom === "danger" ? "bg-danger" : "bg-brand";

  return (
    <Moldura titulo={titulo} descricao={descricao}>
      {itens.length === 0 ? (
        <Vazio>{vazio}</Vazio>
      ) : (
        <ol className="flex flex-col gap-3">
          {itens.map((d, i) => (
            <li key={`${d.nome}-${i}`}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-ink">{d.nome}</span>
                <span className="num shrink-0 font-medium text-ink">
                  {fmt(d.valor)}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
                <div
                  className={`h-full rounded-full ${cor}`}
                  style={{ width: `${Math.max(2, (d.valor / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </Moldura>
  );
}

const CORES_PADRAO = ["#0E4F5E", "#7FB0B9", "#D2A24C", "#B8B2A7"];

/** Proporção entre poucas categorias: uma barra dividida + legenda com números. */
export function SplitCard({
  titulo,
  descricao,
  data,
  cores = CORES_PADRAO,
  vazio = "Sem dados neste mês.",
}: {
  titulo: string;
  descricao?: string;
  data: Serie[];
  cores?: string[];
  vazio?: string;
}) {
  const total = data.reduce((a, d) => a + d.valor, 0);
  return (
    <Moldura titulo={titulo} descricao={descricao}>
      {total === 0 ? (
        <Vazio>{vazio}</Vazio>
      ) : (
        <>
          <div
            className="flex h-2.5 gap-0.5 overflow-hidden rounded-full"
            aria-hidden
          >
            {data.map((d, i) =>
              d.valor > 0 ? (
                <span
                  key={d.nome}
                  style={{
                    width: `${(d.valor / total) * 100}%`,
                    background: cores[i % cores.length],
                  }}
                />
              ) : null,
            )}
          </div>
          <ul className="mt-4 flex flex-col gap-2">
            {data.map((d, i) => (
              <li key={d.nome} className="flex items-center gap-2.5 text-sm">
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ background: cores[i % cores.length] }}
                />
                <span className="min-w-0 flex-1 truncate text-ink">{d.nome}</span>
                <span className="num font-medium text-ink">{d.valor}</span>
                <span className="num w-10 text-right text-ink-3">
                  {Math.round((d.valor / total) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Moldura>
  );
}
