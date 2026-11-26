import Link from "next/link";
import type { ReactNode } from "react";
import type { Status } from "@/lib/ponto";
import { AlertIcon, ArrowRight, CheckIcon } from "./icons";

/* ---------- Botões ---------- */

type Variante = "primario" | "secundario" | "perigo" | "texto" | "suave";
type Tamanho = "md" | "lg";

const BOTAO_BASE =
  "toque inline-flex items-center justify-center gap-2 font-extrabold tracking-[-0.01em] disabled:cursor-not-allowed disabled:opacity-40 select-none";

// Principal cheio; secundário com contorno fino; suave no tom da marca.
const BOTAO_VARIANTE: Record<Variante, string> = {
  primario: "bg-brand text-on-brand hover:bg-brand-strong",
  secundario: "border border-line-strong bg-surface text-ink hover:bg-sunken",
  suave: "border border-brand-line bg-brand-tint text-brand-soft hover:bg-brand-line/40",
  perigo: "border border-danger-line bg-danger-tint text-danger hover:bg-danger-line/40",
  texto: "text-brand-soft hover:text-brand",
};

const BOTAO_TAMANHO: Record<Tamanho, string> = {
  md: "min-h-[2.875rem] rounded-xl px-4 text-[0.875rem]",
  lg: "min-h-[3.25rem] rounded-[0.8rem] px-6 text-[0.9375rem]",
};

/** Classes de botão — use em <button>, <a> ou <Link>. */
export function botao(
  variante: Variante = "primario",
  tamanho: Tamanho = "md",
  extra = "",
): string {
  const t = variante === "texto" ? "text-[0.9375rem]" : BOTAO_TAMANHO[tamanho];
  return `${BOTAO_BASE} ${BOTAO_VARIANTE[variante]} ${t} ${extra}`;
}

/* ---------- Estrutura ---------- */

/** Cartão: superfície sem borda, cantos generosos e sombra suave. */
export function Cartao({
  children,
  className = "",
  as: Tag = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "li" | "article";
}) {
  return (
    <Tag className={`rounded-card bg-surface shadow-card ${className}`}>
      {children}
    </Tag>
  );
}

/** Título de seção (estilo iOS: pequeno, acima do grupo). */
export function TituloSecao({
  children,
  acao,
}: {
  children: ReactNode;
  acao?: ReactNode;
}) {
  return (
    <div className="mb-2.5 flex min-h-[2rem] items-end justify-between gap-3 px-1">
      <h2 className="text-[1.0625rem] font-extrabold tracking-[-0.02em] text-ink">{children}</h2>
      {acao}
    </div>
  );
}

/** Cabeçalho de página com título grande. */
export function TituloPagina({
  titulo,
  sobre,
  descricao,
  acao,
}: {
  titulo: ReactNode;
  sobre?: ReactNode;
  descricao?: ReactNode;
  acao?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 md:mb-8">
      <div className="min-w-0">
        {sobre && <p className="mb-1.5 text-[0.8125rem] text-ink-2">{sobre}</p>}
        <h1 className="titulo-grande text-ink">{titulo}</h1>
        {descricao && <p className="mt-1.5 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-2">{descricao}</p>}
      </div>
      {acao}
    </header>
  );
}

/** Lista agrupada (como os Ajustes do iPhone). */
export function Grupo({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <ul className={`overflow-hidden rounded-card bg-surface shadow-card ${className}`}>
      {children}
    </ul>
  );
}

/** Linha de uma lista agrupada: ícone · texto · valor · seta. */
export function LinhaGrupo({
  href,
  icone,
  titulo,
  sub,
  valor,
  destrutivo = false,
}: {
  href?: string;
  icone?: ReactNode;
  titulo: ReactNode;
  sub?: ReactNode;
  valor?: ReactNode;
  destrutivo?: boolean;
}) {
  const conteudo = (
    <>
      {icone && (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.6rem] bg-brand-tint text-brand">
          {icone}
        </span>
      )}
      <span className="flex min-w-0 flex-1 items-center gap-3 border-b border-line py-3 pr-4 group-last:border-b-0">
        <span className="min-w-0 flex-1">
          <span className={`block truncate text-[0.9375rem] font-bold ${destrutivo ? "text-danger" : "text-ink"}`}>{titulo}</span>
          {sub && <span className="block truncate text-[0.8125rem] text-ink-3">{sub}</span>}
        </span>
        {valor !== undefined && <span className="shrink-0 text-[0.9375rem] text-ink-3">{valor}</span>}
        {href && <ArrowRight className="h-4 w-4 shrink-0 text-ink-3" />}
      </span>
    </>
  );
  const cls = "group flex min-h-[3.25rem] items-center gap-3 pl-4";
  return (
    <li className="group">
      {href ? (
        <Link href={href} className={`${cls} toque active:bg-sunken`}>
          {conteudo}
        </Link>
      ) : (
        <div className={cls}>{conteudo}</div>
      )}
    </li>
  );
}

/** Controle segmentado (abas em pílula). */
export function Segmentado({
  itens,
  ativo,
}: {
  itens: { id: string; rotulo: ReactNode; href: string; contador?: number }[];
  ativo: string;
}) {
  return (
    <nav aria-label="Filtro" className="mb-5 inline-flex max-w-full gap-1.5 overflow-x-auto">
      {itens.map((i) => {
        const on = i.id === ativo;
        return (
          <Link
            key={i.id}
            href={i.href}
            aria-current={on ? "page" : undefined}
            className={`toque flex min-h-[2.375rem] items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-[0.8125rem] font-bold ${
              on
                ? "border-brand-line bg-brand-tint text-brand-soft"
                : "border-line-strong text-ink-2 hover:bg-sunken hover:text-ink"
            }`}
          >
            {i.rotulo}
            {i.contador !== undefined && i.contador > 0 && (
              <span className="num rounded-full bg-brand px-1.5 text-[0.6875rem] font-extrabold leading-[1.15rem] text-on-brand">
                {i.contador}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/** Rótulo + campo, com o rótulo sempre visível. */
export function Campo({
  rotulo,
  dica,
  children,
  className = "",
}: {
  rotulo: string;
  dica?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="px-0.5 text-[0.8125rem] font-semibold text-ink-2">{rotulo}</span>
      {children}
      {dica && <span className="px-0.5 text-xs leading-relaxed text-ink-3">{dica}</span>}
    </label>
  );
}

/* ---------- Avisos ---------- */

type Tom = "erro" | "ok" | "aviso" | "info";

const AVISO_TOM: Record<Tom, string> = {
  erro: "border border-danger-line bg-danger-tint text-danger",
  ok: "border border-ok-line bg-ok-tint text-ok",
  aviso: "border border-warn-line bg-warn-tint text-warn",
  info: "border border-brand-line bg-brand-tint text-brand-soft",
};

export function Aviso({
  tom = "erro",
  children,
  className = "",
}: {
  tom?: Tom;
  children: ReactNode;
  className?: string;
}) {
  const Icone = tom === "ok" ? CheckIcon : AlertIcon;
  return (
    <div
      role={tom === "erro" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-2xl px-4 py-3.5 text-[0.9375rem] ${AVISO_TOM[tom]} ${className}`}
    >
      <Icone className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="min-w-0 flex-1 leading-relaxed">{children}</div>
    </div>
  );
}

/* ---------- Etiquetas ---------- */

const ETIQUETA_TOM: Record<Tom | "neutro", string> = {
  erro: "bg-danger-tint text-danger",
  ok: "bg-ok-tint text-ok",
  aviso: "bg-warn-tint text-warn",
  info: "bg-brand-tint text-brand-soft",
  neutro: "border border-line-strong bg-sunken text-ink-2",
};

export function Etiqueta({
  tom = "neutro",
  children,
}: {
  tom?: Tom | "neutro";
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[0.6875rem] font-bold ${ETIQUETA_TOM[tom]}`}
    >
      {children}
    </span>
  );
}

const STATUS_META: Record<Status, { rotulo: string; ponto: string; texto: string; fundo: string }> = {
  off: { rotulo: "Fora de turno", ponto: "bg-ink-3", texto: "text-ink-2", fundo: "bg-sunken" },
  working: { rotulo: "Em turno", ponto: "bg-ok", texto: "text-ok", fundo: "bg-ok-tint" },
  break: { rotulo: "Em intervalo", ponto: "bg-warn", texto: "text-warn", fundo: "bg-warn-tint" },
};

/** Situação do funcionário agora: pílula com ponto colorido. */
export function StatusJornada({
  status,
  desde,
  pilula = false,
}: {
  status: Status;
  desde?: string | null;
  pilula?: boolean;
}) {
  const m = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-2 text-sm font-semibold ${m.texto} ${
        pilula ? `rounded-full px-3 py-1 ${m.fundo}` : ""
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${m.ponto} ${status === "working" ? "animate-pulse-dot" : ""}`} />
      {m.rotulo}
      {desde && status !== "off" && <span className="font-medium opacity-75">desde {desde}</span>}
    </span>
  );
}

/** Barra de progresso (ex.: horas trabalhadas / meta). */
export function Progresso({
  valor,
  total,
  rotulo,
}: {
  valor: number;
  total: number;
  rotulo: string;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((valor / total) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={rotulo}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className="h-2 w-full overflow-hidden rounded-full bg-sunken"
    >
      <div
        className={`h-full rounded-full transition-[width] duration-700 ${pct >= 100 ? "bg-ok" : "bg-brand"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Iniciais do nome para o avatar. */
export function iniciaisDe(nome: string): string {
  const p = nome.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

export function Avatar({
  nome,
  tamanho = "md",
}: {
  nome: string;
  tamanho?: "sm" | "md" | "lg" | "xl";
}) {
  const t =
    tamanho === "xl"
      ? "h-20 w-20 text-2xl"
      : tamanho === "lg"
        ? "h-14 w-14 text-lg"
        : tamanho === "sm"
          ? "h-8 w-8 text-[0.6875rem]"
          : "h-10 w-10 text-[0.8125rem]";
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-brand-line bg-brand-tint font-extrabold tracking-wide text-brand-soft ${t}`}
    >
      {iniciaisDe(nome)}
    </span>
  );
}
