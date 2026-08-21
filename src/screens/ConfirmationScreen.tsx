"use client";

import { usePrototype } from "@/lib/prototype";
import { Button, ScreenShell } from "@/components/ui";
import { CheckIcon, PinIcon } from "@/components/icons";
import { GEOFENCE } from "@/lib/mock-data";

export function ConfirmationScreen() {
  const { state, dispatch } = usePrototype();
  const punch = state.lastConfirmed;

  // Salvaguarda: sem marcação registrada, volta para a home.
  if (!punch) {
    return (
      <ScreenShell className="items-center justify-center">
        <Button
          variant="ghost"
          onClick={() => dispatch({ type: "GO", screen: "home" })}
        >
          Voltar ao início
        </Button>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell className="justify-center">
      <div className="flex flex-col items-center text-center">
        <p className="mb-8 text-[11px] font-semibold uppercase tracking-[0.2em] text-signal">
          Ponto registrado
        </p>

        {/* Palco do carimbo */}
        <div className="relative mb-8 flex h-64 w-64 items-center justify-center">
          {/* Onda de impacto */}
          <div className="stamp-el pointer-events-none absolute inset-6 rounded-[50%] border-2 border-amber/50 animate-stamp-ripple" />

          {/* Carimbo */}
          <div className="stamp-el animate-stamp-impact">
            <div className="animate-card-shake">
              <div className="relative flex h-52 w-52 flex-col items-center justify-center gap-2 rounded-[50%] border-[3px] border-amber bg-amber/5 px-6 text-center shadow-[0_0_0_2px_rgba(245,166,35,0.25)]">
                <span className="absolute inset-2 rounded-[50%] border border-amber/40" />
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber">
                  Ponto · j2aponto
                </p>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber text-graphite">
                  <CheckIcon className="h-8 w-8" strokeWidth={2.5} />
                </div>
                <p className="text-lg font-bold leading-tight text-ink">
                  {punch.type}
                </p>
                <p className="font-mono text-2xl font-bold tabular-nums text-ink">
                  {punch.label}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Localização confirmada */}
        <div className="mb-1 flex items-center gap-2 text-signal">
          <PinIcon className="h-4 w-4" />
          <span className="text-sm font-medium">
            {GEOFENCE.siteName} — dentro da área
          </span>
        </div>
        <p className="text-xs text-muted">
          Registro validado por reconhecimento facial
        </p>
      </div>

      <div className="mt-10">
        <Button
          variant="amber"
          onClick={() => dispatch({ type: "GO", screen: "home" })}
        >
          Voltar ao início
        </Button>
      </div>
    </ScreenShell>
  );
}
