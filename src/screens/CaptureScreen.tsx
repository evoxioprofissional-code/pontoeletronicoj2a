"use client";

import { useCallback, useEffect, useState } from "react";
import { usePrototype } from "@/lib/prototype";
import { GeofencePill } from "@/components/ui";
import { AlertIcon, ArrowLeft, UserIcon } from "@/components/icons";
import { dateToSeconds, makePunch } from "@/lib/time";

type Phase = "scanning" | "error";

export function CaptureScreen() {
  const { state, dispatch, nextType } = usePrototype();
  const [phase, setPhase] = useState<Phase>("scanning");

  const startScan = useCallback(() => {
    setPhase("scanning");
  }, []);

  // Simula o processamento do reconhecimento (~2s) e resolve conforme a
  // rota escolhida no painel de demonstração (sucesso/falha).
  useEffect(() => {
    if (phase !== "scanning") return;
    const id = setTimeout(() => {
      if (state.faceOutcome === "success") {
        const punch = makePunch(nextType, dateToSeconds(new Date()));
        dispatch({ type: "COMMIT_PUNCH", punch });
      } else {
        setPhase("error");
      }
    }, 2000);
    return () => clearTimeout(id);
  }, [phase, state.faceOutcome, nextType, dispatch]);

  return (
    <div className="flex min-h-full flex-col px-5 pb-8">
      {/* Barra superior: cancelar + geofence */}
      <div className="flex items-center gap-3 pt-4">
        <button
          onClick={() => dispatch({ type: "GO", screen: "home" })}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-steel text-ink ring-1 ring-steel-line"
          aria-label="Cancelar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <GeofencePill inside={state.insideGeofence} />
        </div>
      </div>

      <div className="mb-5 mt-6 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          Registrando · {nextType}
        </p>
        <h1 className="mt-1 text-xl font-semibold text-ink">
          {phase === "scanning"
            ? "Reconhecimento facial"
            : "Não foi possível reconhecer"}
        </h1>
      </div>

      {/* Viewfinder */}
      <div className="relative mx-auto aspect-[3/4] w-full max-w-[300px] overflow-hidden rounded-3xl border border-steel-line bg-black">
        {/* Placeholder de câmera (não é câmera real) */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,#2A313B_0%,#12151a_60%,#0a0c10_100%)]" />
        {/* Silhueta sutil de rosto */}
        <UserIcon className="absolute left-1/2 top-[34%] h-40 w-40 -translate-x-1/2 text-white/[0.04]" />

        {/* Guia oval + anel de scan */}
        <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2">
          <div className="relative h-[190px] w-[150px]">
            {phase === "scanning" && (
              <>
                <div className="absolute inset-0 rounded-[50%] border-2 border-amber/70 animate-scan-ring" />
                <div className="absolute -inset-2 rounded-[50%] border border-amber/30 animate-scan-ring [animation-delay:600ms]" />
              </>
            )}
            <div
              className={`absolute inset-0 rounded-[50%] border-2 border-dashed ${
                phase === "error" ? "border-danger/80" : "border-ink/40"
              }`}
            />
            {/* Cantos de mira */}
            {["top-0 left-0 border-t-2 border-l-2 rounded-tl-xl",
              "top-0 right-0 border-t-2 border-r-2 rounded-tr-xl",
              "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-xl",
              "bottom-0 right-0 border-b-2 border-r-2 rounded-br-xl",
            ].map((pos) => (
              <span
                key={pos}
                className={`absolute h-6 w-6 ${
                  phase === "error" ? "border-danger" : "border-amber"
                } ${pos}`}
              />
            ))}
          </div>
        </div>

        {/* Linha de varredura */}
        {phase === "scanning" && (
          <div className="pointer-events-none absolute inset-x-8 top-1/2 h-16 -translate-y-1/2">
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-amber to-transparent shadow-[0_0_12px_2px_rgba(245,166,35,0.5)] animate-scan-line" />
          </div>
        )}

        {/* Rodapé do viewfinder */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-8 text-center">
          {phase === "scanning" ? (
            <p className="flex items-center justify-center gap-2 text-sm font-medium text-amber">
              <span className="h-1.5 w-1.5 animate-amber-pulse rounded-full bg-amber" />
              Processando reconhecimento…
            </p>
          ) : (
            <p className="text-sm font-medium text-danger">
              Rosto não reconhecido
            </p>
          )}
        </div>
      </div>

      {/* Instrução / erro */}
      {phase === "scanning" ? (
        <p className="mt-6 text-center text-sm text-muted">
          Posicione o rosto dentro do guia e mantenha-se parado.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          <div className="flex items-start gap-3 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-danger">
            <AlertIcon className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm">
              Rosto não reconhecido. Verifique a iluminação e tente novamente.
            </p>
          </div>
          <button
            onClick={startScan}
            className="w-full rounded-2xl bg-amber px-5 py-4 text-base font-semibold text-graphite shadow-amber-glow transition hover:bg-amber-soft active:scale-[0.99]"
          >
            Tentar novamente
          </button>
          <button
            onClick={() => dispatch({ type: "GO", screen: "home" })}
            className="w-full rounded-2xl bg-steel px-5 py-4 text-base font-semibold text-ink ring-1 ring-steel-line transition hover:bg-steel-line"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
