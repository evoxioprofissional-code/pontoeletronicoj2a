"use client";

import { usePrototype } from "@/lib/prototype";
import type { Screen } from "@/lib/types";
import { ArrowLeft, ArrowRight } from "./icons";

const SCREENS: { id: Screen; label: string }[] = [
  { id: "splash", label: "Splash" },
  { id: "login", label: "Login" },
  { id: "home", label: "Home" },
  { id: "capture", label: "Captura" },
  { id: "confirmation", label: "Confirmação" },
  { id: "history", label: "Histórico" },
  { id: "profile", label: "Perfil" },
];

export function PrototypeControls() {
  const { state, dispatch } = usePrototype();
  const idx = SCREENS.findIndex((s) => s.id === state.screen);

  const go = (i: number) => {
    const clamped = (i + SCREENS.length) % SCREENS.length;
    dispatch({ type: "GO", screen: SCREENS[clamped].id });
  };

  return (
    <div className="w-full max-w-[420px]">
      {/* Prev / indicador / next */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => go(idx - 1)}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-steel text-ink ring-1 ring-steel-line transition hover:bg-steel-line"
          aria-label="Tela anterior"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="text-center">
          <p className="font-mono text-sm text-muted">
            {String(idx + 1).padStart(2, "0")} / {SCREENS.length}
          </p>
          <p className="text-sm font-semibold text-ink">{SCREENS[idx].label}</p>
        </div>

        <button
          onClick={() => go(idx + 1)}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-steel text-ink ring-1 ring-steel-line transition hover:bg-steel-line"
          aria-label="Próxima tela"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>

      {/* Tabs diretas para cada tela */}
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {SCREENS.map((s) => {
          const active = s.id === state.screen;
          return (
            <button
              key={s.id}
              onClick={() => dispatch({ type: "GO", screen: s.id })}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? "bg-amber text-graphite"
                  : "bg-steel text-muted ring-1 ring-steel-line hover:text-ink"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
