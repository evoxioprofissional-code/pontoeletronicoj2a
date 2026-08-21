"use client";

import type { ReactNode } from "react";
import { useClock } from "@/lib/useClock";

function StatusBarClock() {
  const now = useClock();
  const hhmm = now
    ? `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes(),
      ).padStart(2, "0")}`
    : "--:--";
  return <span className="font-mono text-[13px] tracking-tight">{hhmm}</span>;
}

/** Ícones minimalistas da barra de status (sinal, wifi, bateria). */
function StatusBarIcons() {
  return (
    <div className="flex items-center gap-1.5 text-ink">
      {/* sinal */}
      <svg width="17" height="11" viewBox="0 0 17 11" fill="none" aria-hidden>
        <rect x="0" y="7" width="3" height="4" rx="1" fill="currentColor" />
        <rect x="4.5" y="5" width="3" height="6" rx="1" fill="currentColor" />
        <rect x="9" y="2.5" width="3" height="8.5" rx="1" fill="currentColor" />
        <rect x="13.5" y="0" width="3" height="11" rx="1" fill="currentColor" />
      </svg>
      {/* wifi */}
      <svg width="16" height="11" viewBox="0 0 16 11" fill="none" aria-hidden>
        <path
          d="M8 9.5a1.3 1.3 0 100-2.6 1.3 1.3 0 000 2.6z"
          fill="currentColor"
        />
        <path
          d="M3.4 5.6a6.5 6.5 0 019.2 0M1 3.2a9.9 9.9 0 0114 0"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
      {/* bateria */}
      <div className="flex items-center gap-0.5">
        <div className="relative h-[11px] w-[23px] rounded-[3px] border border-ink/60 p-[1.5px]">
          <div className="h-full w-[70%] rounded-[1.5px] bg-ink" />
        </div>
        <div className="h-[4px] w-[1.5px] rounded-r bg-ink/60" />
      </div>
    </div>
  );
}

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative shrink-0">
      {/* Chassi externo */}
      <div className="rounded-[3.2rem] bg-[#05070a] p-[10px] shadow-phone ring-1 ring-white/5">
        {/* Aro interno / borda de tela */}
        <div className="rounded-[2.7rem] bg-black p-[2px]">
          {/* Tela */}
          <div className="relative h-[812px] w-[375px] overflow-hidden rounded-[2.55rem] bg-graphite">
            {/* Ilha dinâmica */}
            <div className="pointer-events-none absolute left-1/2 top-[11px] z-40 h-[30px] w-[112px] -translate-x-1/2 rounded-full bg-black" />

            {/* Barra de status */}
            <div className="absolute inset-x-0 top-0 z-30 flex h-[48px] items-center justify-between px-7 pt-2.5">
              <StatusBarClock />
              <StatusBarIcons />
            </div>

            {/* Conteúdo da tela do app (rola internamente) */}
            <div className="no-scrollbar absolute inset-0 overflow-y-auto pt-[48px]">
              {children}
            </div>

            {/* Barra de gestos (home indicator) */}
            <div className="pointer-events-none absolute bottom-2 left-1/2 z-40 h-[5px] w-[135px] -translate-x-1/2 rounded-full bg-ink/30" />
          </div>
        </div>
      </div>
    </div>
  );
}
