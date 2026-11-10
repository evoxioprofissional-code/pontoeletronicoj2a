import type { ReactNode } from "react";
import type { Status } from "@/lib/ponto";
import { AlertIcon, CheckIcon } from "./icons";

/* ---------- Botões ---------- */

type Variante = "primario" | "secundario" | "perigo" | "texto";
type Tamanho = "md" | "lg";

const BOTAO_BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed select-none";

const BOTAO_VARIANTE: Record<Variante, string> = {
  primario:
    "bg-brand text-white hover:bg-brand-strong active:bg-brand-strong disabled:bg-line disabled:text-ink-3",
  secundario:
    "border border-line-strong bg-surface text-ink hover:border-ink-3 active:bg-paper disabled:text-ink-3 disabled:hover:border-line-strong",
  perigo:
    "border border-danger-line bg-surface text-danger hover:bg-danger-tint active:bg-danger-tint",
  texto: "text-brand hover:text-brand-strong underline-offset-4 hover:underline",
};

const BOTAO_TAMANHO: Record<Tamanho, string> = {
  md: "min-h-[2.75rem] px-4 text-[0.9375rem]",
  lg: "min-h-[3.5rem] px-5 text-[1.0625rem]",
};

/** Classes de botão — use em <button>, <a> ou <Link>. */
export function botao(
  variante: Variante = "primario",
  tamanho: Tamanho = "md",
  extra = "",
): string {
  return `${BOTAO_BASE} ${BOTAO_VARIANTE[variante]} ${BOTAO_TAMANHO[tamanho]} ${extra}`;
}

/* ---------- Estrutura ---------- */

/** Cartão: superfície branca com borda fina. */
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
    <Tag className={`rounded-xl border border-line bg-surface ${className}`}>
      {children}
    </Tag>
  );
}

/** Título de seção dentro de uma página. */
export function TituloSecao({
  children,
  acao,
}: {
  children: ReactNode;
  acao?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-[0.9375rem] font-semibold text-ink">{children}</h2>
      {acao}
    </div>
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
      <span className="text-sm font-medium text-ink-2">{rotulo}</span>
      {children}
      {dica && <span className="text-xs text-ink-3">{dica}</span>}
    </label>
  );
}

/* ---------- Avisos ---------- */

type Tom = "erro" | "ok" | "aviso" | "info";

const AVISO_TOM: Record<Tom, string> = {
  erro: "border-danger-line bg-danger-tint text-danger",
  ok: "border-ok-line bg-ok-tint text-ok",
  aviso: "border-warn-line bg-warn-tint text-warn",
  info: "border-brand-line bg-brand-tint text-brand",
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
      className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm ${AVISO_TOM[tom]} ${className}`}
    >
      <Icone className="mt-0.5 h-[1.125rem] w-[1.125rem] shrink-0" />
      <div className="min-w-0 flex-1 leading-relaxed">{children}</div>
    </div>
  );
}

/* ---------- Etiquetas ---------- */

const ETIQUETA_TOM: Record<Tom | "neutro", string> = {
  erro: "bg-danger-tint text-danger",
  ok: "bg-ok-tint text-ok",
  aviso: "bg-warn-tint text-warn",
  info: "bg-brand-tint text-brand",
  neutro: "bg-paper text-ink-2 ring-1 ring-inset ring-line",
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
      className={`inline-flex items-center whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium ${ETIQUETA_TOM[tom]}`}
    >
      {children}
    </span>
  );
}

const STATUS_META: Record<Status, { rotulo: string; ponto: string; texto: string }> =
  {
    off: { rotulo: "Fora de turno", ponto: "bg-ink-3", texto: "text-ink-2" },
    working: { rotulo: "Em turno", ponto: "bg-ok", texto: "text-ok" },
    break: { rotulo: "Em intervalo", ponto: "bg-warn", texto: "text-warn" },
  };

/** Situação do funcionário agora: ponto colorido + texto. */
export function StatusJornada({
  status,
  desde,
}: {
  status: Status;
  desde?: string | null;
}) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-2 text-sm font-medium ${m.texto}`}>
      <span className={`h-2 w-2 rounded-full ${m.ponto}`} />
      {m.rotulo}
      {desde && status !== "off" && (
        <span className="font-normal text-ink-3">desde {desde}</span>
      )}
    </span>
  );
}

/** Barra de progresso fina (ex.: horas trabalhadas / meta). */
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
      className="h-1.5 w-full overflow-hidden rounded-full bg-line"
    >
      <div
        className={`h-full rounded-full ${pct >= 100 ? "bg-ok" : "bg-brand"}`}
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
  tamanho?: "sm" | "md" | "lg";
}) {
  const t =
    tamanho === "lg"
      ? "h-14 w-14 text-lg"
      : tamanho === "sm"
        ? "h-8 w-8 text-xs"
        : "h-10 w-10 text-sm";
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-lg bg-brand-tint font-semibold text-brand ${t}`}
    >
      {iniciaisDe(nome)}
    </span>
  );
}
