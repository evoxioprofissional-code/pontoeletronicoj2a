"use client";

import { useClock } from "@/lib/useClock";

const DATA_CURTA = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "long",
});

const DATA_LONGA = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export function LiveClock({ mostrarData = true }: { mostrarData?: boolean }) {
  const now = useClock();
  const time = now
    ? `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes(),
      ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
    : "--:--:--";
  const date = now ? DATA_CURTA.format(now) : "";

  return (
    <div className="text-center">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
        Horário atual
      </p>
      <p className="font-mono text-[3.4rem] font-bold leading-none tracking-tight text-ink tabular-nums">
        {time}
      </p>
      {mostrarData && (
        <p className="mt-2 text-sm capitalize text-muted">{date}</p>
      )}
    </div>
  );
}

/** Data por extenso (client, respeita o fuso do usuário). */
export function DataExtenso() {
  const now = useClock();
  if (!now) return <span />;
  const s = DATA_LONGA.format(now);
  return <span>{s.charAt(0).toUpperCase() + s.slice(1)}</span>;
}
