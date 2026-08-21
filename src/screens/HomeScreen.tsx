"use client";

import { usePrototype } from "@/lib/prototype";
import { useClock } from "@/lib/useClock";
import {
  Button,
  GeofencePill,
  ScreenShell,
  SectionLabel,
  StatusBadge,
} from "@/components/ui";
import { PunchIcon, ClockIcon, UserIcon, ScanFaceIcon } from "@/components/icons";
import { EMPLOYEE } from "@/lib/mock-data";

const DATE_FMT = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "long",
});

export function HomeScreen() {
  const { state, dispatch, status, nextType } = usePrototype();
  const now = useClock();
  const inside = state.insideGeofence;

  const timeLabel = now
    ? `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes(),
      ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
    : "--:--:--";
  const dateLabel = now ? DATE_FMT.format(now) : "";

  const last = state.todayPunches[state.todayPunches.length - 1] ?? null;

  return (
    <ScreenShell>
      {/* Cabeçalho: saudação + funcionário */}
      <header className="flex items-center justify-between pt-4">
        <div>
          <p className="text-sm text-muted">Olá,</p>
          <p className="text-lg font-semibold text-ink">
            {EMPLOYEE.name.split(" ")[0]}
          </p>
        </div>
        <StatusBadge status={status} />
      </header>

      {/* Relógio — elemento de maior destaque da tela */}
      <section className="mt-5 rounded-3xl border border-steel-line bg-steel px-5 py-6 text-center">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          Horário atual
        </p>
        <p className="font-mono text-[3.4rem] font-bold leading-none tracking-tight text-ink tabular-nums">
          {timeLabel}
        </p>
        <p className="mt-2 text-sm capitalize text-muted">{dateLabel}</p>
      </section>

      {/* Geofence */}
      <div className="mt-4">
        <GeofencePill inside={inside} />
      </div>

      {/* CTA principal — bater ponto */}
      <div className="mt-4">
        <Button
          variant="amber"
          disabled={!inside}
          onClick={() => dispatch({ type: "GO", screen: "capture" })}
          className="!py-5 text-lg"
        >
          <ScanFaceIcon className="h-6 w-6" />
          Bater Ponto
          <span className="ml-1 rounded-md bg-graphite/20 px-2 py-0.5 font-mono text-xs">
            {nextType}
          </span>
        </Button>
        {!inside && (
          <p className="mt-2 text-center text-sm text-danger">
            Aproxime-se da fábrica para registrar o ponto.
          </p>
        )}
      </div>

      {/* Último registro */}
      <div className="mt-6">
        <SectionLabel>Último registro</SectionLabel>
        {last ? (
          <div className="flex items-center gap-3 rounded-2xl border border-steel-line bg-steel px-4 py-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-graphite text-amber ring-1 ring-steel-line">
              <PunchIcon type={last.type} className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-ink">{last.type}</p>
              <p className="text-sm text-muted">Fábrica Central</p>
            </div>
            <p className="font-mono text-lg text-ink tabular-nums">
              {last.label.slice(0, 5)}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-steel-line bg-steel/50 px-4 py-5 text-center text-sm text-muted">
            Nenhum registro hoje ainda.
          </div>
        )}
      </div>

      {/* Atalhos secundários */}
      <div className="mt-auto grid grid-cols-2 gap-3 pt-6">
        <Button
          variant="ghost"
          onClick={() => dispatch({ type: "GO", screen: "history" })}
        >
          <ClockIcon className="h-5 w-5" />
          Histórico
        </Button>
        <Button
          variant="ghost"
          onClick={() => dispatch({ type: "GO", screen: "profile" })}
        >
          <UserIcon className="h-5 w-5" />
          Perfil
        </Button>
      </div>
    </ScreenShell>
  );
}
