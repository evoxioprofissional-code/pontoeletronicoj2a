import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { Status } from "@/lib/types";
import { PinIcon } from "./icons";

/** Wrapper de conteúdo de tela com respiro lateral consistente. */
export function ScreenShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex min-h-full flex-col px-5 pb-8 ${className}`}>
      {children}
    </div>
  );
}

/** Rótulo de seção em caixa alta, espaçado — tom de painel técnico. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
      {children}
    </p>
  );
}

const STATUS_META: Record<
  Status,
  { label: string; dot: string; text: string; ring: string }
> = {
  off: {
    label: "Fora de turno",
    dot: "bg-muted",
    text: "text-muted",
    ring: "ring-steel-line",
  },
  working: {
    label: "Em turno",
    dot: "bg-signal",
    text: "text-signal",
    ring: "ring-signal/30",
  },
  break: {
    label: "Em intervalo",
    dot: "bg-amber",
    text: "text-amber",
    ring: "ring-amber/30",
  },
};

export function StatusBadge({ status }: { status: Status }) {
  const m = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full bg-steel px-3 py-1.5 text-sm font-semibold ring-1 ${m.ring} ${m.text}`}
    >
      <span className={`h-2 w-2 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

/** Pílula do geofence — verde dentro da área, vermelho fora. */
export function GeofencePill({ inside }: { inside: boolean }) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-sm font-medium ${
        inside
          ? "border-signal/25 bg-signal/10 text-signal"
          : "border-danger/30 bg-danger/10 text-danger"
      }`}
      role="status"
    >
      <PinIcon className="h-5 w-5 shrink-0" />
      <span>
        {inside
          ? "Você está dentro da área da fábrica"
          : "Fora da área permitida"}
      </span>
    </div>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "amber" | "ghost" | "danger";
};

export function Button({
  variant = "amber",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const styles: Record<string, string> = {
    amber:
      "bg-amber text-graphite hover:bg-amber-soft active:scale-[0.99] shadow-amber-glow disabled:bg-steel disabled:text-muted disabled:shadow-none disabled:cursor-not-allowed",
    ghost:
      "bg-steel text-ink ring-1 ring-steel-line hover:bg-steel-line active:scale-[0.99]",
    danger:
      "bg-transparent text-danger ring-1 ring-danger/40 hover:bg-danger/10 active:scale-[0.99]",
  };
  return (
    <button
      className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-base font-semibold transition ${styles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
