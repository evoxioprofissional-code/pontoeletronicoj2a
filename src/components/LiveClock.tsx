"use client";

import { useClock } from "@/lib/useClock";

const DATE_FMT = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "long",
});

export function LiveClock() {
  const now = useClock();
  const time = now
    ? `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes(),
      ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
    : "--:--:--";
  const date = now ? DATE_FMT.format(now) : "";

  return (
    <div className="text-center">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
        Horário atual
      </p>
      <p className="font-mono text-[3.4rem] font-bold leading-none tracking-tight text-ink tabular-nums">
        {time}
      </p>
      <p className="mt-2 text-sm capitalize text-muted">{date}</p>
    </div>
  );
}
