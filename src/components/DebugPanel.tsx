"use client";

import { usePrototype } from "@/lib/prototype";
import type { FaceOutcome } from "@/lib/types";

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string; tone: "signal" | "danger" }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl bg-graphite p-1 ring-1 ring-steel-line">
      {options.map((o) => {
        const active = o.id === value;
        const activeCls =
          o.tone === "signal"
            ? "bg-signal/15 text-signal ring-1 ring-signal/40"
            : "bg-danger/15 text-danger ring-1 ring-danger/40";
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              active ? activeCls : "text-muted hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function DebugPanel() {
  const { state, dispatch } = usePrototype();

  return (
    <div className="w-full max-w-[300px] rounded-2xl border border-steel-line bg-steel p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-amber" />
        <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-ink">
          Controles de demonstração
        </h2>
      </div>
      <p className="mb-5 text-xs leading-relaxed text-muted">
        Alterne os cenários mockados para apresentar cada situação ao cliente.
        Nada aqui é real — sem GPS, câmera ou servidor.
      </p>

      {/* Geofence */}
      <div className="mb-5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
          Localização (cerca eletrônica)
        </p>
        <Segmented
          value={state.insideGeofence ? "in" : "out"}
          onChange={(v) =>
            dispatch({ type: "SET_GEOFENCE", value: v === "in" })
          }
          options={[
            { id: "in", label: "Dentro", tone: "signal" },
            { id: "out", label: "Fora", tone: "danger" },
          ]}
        />
      </div>

      {/* Reconhecimento facial */}
      <div className="mb-5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
          Reconhecimento facial
        </p>
        <Segmented<FaceOutcome>
          value={state.faceOutcome}
          onChange={(v) => dispatch({ type: "SET_FACE_OUTCOME", value: v })}
          options={[
            { id: "success", label: "Sucesso", tone: "signal" },
            { id: "fail", label: "Falha", tone: "danger" },
          ]}
        />
      </div>

      {/* Reiniciar */}
      <button
        onClick={() => dispatch({ type: "RESET" })}
        className="w-full rounded-xl bg-graphite px-4 py-2.5 text-sm font-semibold text-muted ring-1 ring-steel-line transition hover:text-ink"
      >
        Reiniciar demonstração
      </button>
    </div>
  );
}
