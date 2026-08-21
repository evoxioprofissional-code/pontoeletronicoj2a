"use client";

import { useState } from "react";
import { usePrototype } from "@/lib/prototype";
import { useClock } from "@/lib/useClock";
import { ScreenShell, SectionLabel } from "@/components/ui";
import {
  ArrowLeft,
  ArrowRight,
  PunchIcon,
} from "@/components/icons";
import { YESTERDAY_PUNCHES } from "@/lib/mock-data";
import { dateToSeconds, formatDuration, workedSeconds } from "@/lib/time";
import type { PunchRecord } from "@/lib/types";

export function HistoryScreen() {
  const { state, dispatch } = usePrototype();
  const now = useClock();
  // 0 = ontem, 1 = hoje
  const [dayIdx, setDayIdx] = useState(1);

  const isToday = dayIdx === 1;
  const punches: PunchRecord[] = isToday
    ? state.todayPunches
    : YESTERDAY_PUNCHES;
  const title = isToday ? "Hoje" : "Ontem";

  const nowSeconds = now ? dateToSeconds(now) : 12 * 3600;
  const worked = workedSeconds(punches, nowSeconds);

  return (
    <ScreenShell>
      {/* Cabeçalho */}
      <header className="flex items-center gap-3 pt-4">
        <button
          onClick={() => dispatch({ type: "GO", screen: "home" })}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-steel text-ink ring-1 ring-steel-line"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-semibold text-ink">Histórico</h1>
      </header>

      {/* Seletor de dia */}
      <div className="mt-5 flex items-center justify-between rounded-2xl border border-steel-line bg-steel px-2 py-2">
        <button
          onClick={() => setDayIdx(0)}
          disabled={dayIdx === 0}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-ink transition hover:bg-steel-line disabled:opacity-30"
          aria-label="Dia anterior"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="font-semibold text-ink">{title}</p>
          <p className="text-xs text-muted">
            {isToday ? "Em andamento" : "Jornada encerrada"}
          </p>
        </div>
        <button
          onClick={() => setDayIdx(1)}
          disabled={dayIdx === 1}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-ink transition hover:bg-steel-line disabled:opacity-30"
          aria-label="Próximo dia"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>

      {/* Resumo de horas */}
      <section className="mt-4 rounded-2xl border border-steel-line bg-steel px-5 py-4">
        <SectionLabel>Horas trabalhadas</SectionLabel>
        <div className="flex items-end justify-between">
          <p className="font-mono text-4xl font-bold tabular-nums text-amber">
            {formatDuration(worked)}
          </p>
          <p className="pb-1 text-sm text-muted">
            {punches.length}{" "}
            {punches.length === 1 ? "marcação" : "marcações"}
          </p>
        </div>
      </section>

      {/* Lista estilo cartão de ponto */}
      <div className="mt-5">
        <SectionLabel>Marcações do dia</SectionLabel>
        {punches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-steel-line bg-steel/50 px-4 py-6 text-center text-sm text-muted">
            Nenhuma marcação neste dia.
          </div>
        ) : (
          <ol className="overflow-hidden rounded-2xl border border-steel-line">
            {punches.map((p, i) => (
              <li
                key={`${p.type}-${i}`}
                className="flex items-center gap-3 border-b border-steel-line bg-steel px-4 py-3.5 last:border-b-0"
              >
                <span className="w-6 text-center font-mono text-sm text-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-graphite text-amber ring-1 ring-steel-line">
                  <PunchIcon type={p.type} className="h-5 w-5" />
                </div>
                <p className="flex-1 font-medium text-ink">{p.type}</p>
                <p className="font-mono text-lg tabular-nums text-ink">
                  {p.label}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-muted">
        Dados de demonstração · sujeito a validação do RH
      </p>
    </ScreenShell>
  );
}
