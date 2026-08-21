"use client";

import { useEffect, useRef, useState } from "react";
import { carregarModelos, extrairDescritor } from "@/lib/face/client";
import { AlertIcon, ArrowLeft } from "./icons";

interface Props {
  titulo: string;
  instrucao: string;
  acaoLabel: string;
  ocupado?: boolean;
  onDescritor: (descriptor: number[]) => void;
  onCancelar: () => void;
}

type Fase = "carregando" | "pronto" | "erro";

export function CameraCapture({
  titulo,
  instrucao,
  acaoLabel,
  ocupado = false,
  onDescritor,
  onCancelar,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [fase, setFase] = useState<Fase>("carregando");
  const [msg, setMsg] = useState<string | null>(null);
  const [capturando, setCapturando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    async function iniciar() {
      try {
        await carregarModelos();
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 480, height: 640 },
          audio: false,
        });
        if (cancelado) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setFase("pronto");
      } catch {
        setFase("erro");
        setMsg("Não foi possível acessar a câmera. Verifique as permissões.");
      }
    }
    iniciar();
    return () => {
      cancelado = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function capturar() {
    if (!videoRef.current || capturando || ocupado) return;
    setCapturando(true);
    setMsg(null);
    try {
      const d = await extrairDescritor(videoRef.current);
      if (!d) {
        setMsg("Rosto não detectado. Centralize o rosto no guia.");
        setCapturando(false);
        return;
      }
      onDescritor(d);
    } catch {
      setMsg("Erro ao processar a imagem. Tente novamente.");
    } finally {
      setCapturando(false);
    }
  }

  const processando = capturando || ocupado;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-graphite">
      {/* Topo */}
      <div className="flex items-center gap-3 px-5 pb-3 pt-5">
        <button
          onClick={onCancelar}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-steel text-ink ring-1 ring-steel-line"
          aria-label="Cancelar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-ink">{titulo}</h1>
      </div>

      {/* Viewfinder */}
      <div className="relative mx-auto mt-2 w-full max-w-sm flex-1 px-5">
        <div className="relative h-full overflow-hidden rounded-3xl border border-steel-line bg-black">
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full scale-x-[-1] object-cover"
          />

          {/* Guia oval + anel de scan */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative h-[240px] w-[190px]">
              {fase === "pronto" && (
                <div className="absolute inset-0 rounded-[50%] border-2 border-amber/70 animate-scan-ring" />
              )}
              <div className="absolute inset-0 rounded-[50%] border-2 border-dashed border-ink/50" />
            </div>
          </div>

          {/* Estado de carregamento */}
          {fase === "carregando" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber animate-amber-pulse" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber animate-amber-pulse [animation-delay:200ms]" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber animate-amber-pulse [animation-delay:400ms]" />
              </div>
              <p className="text-sm text-muted">Carregando reconhecimento…</p>
            </div>
          )}

          {fase === "erro" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 px-6 text-center">
              <AlertIcon className="h-8 w-8 text-danger" />
              <p className="text-sm text-danger">{msg}</p>
            </div>
          )}

          {processando && fase === "pronto" && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-8 text-center">
              <p className="flex items-center justify-center gap-2 text-sm font-medium text-amber">
                <span className="h-1.5 w-1.5 animate-amber-pulse rounded-full bg-amber" />
                Processando…
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Rodapé */}
      <div className="px-5 pb-8 pt-4">
        <p className="mb-3 text-center text-sm text-muted">{instrucao}</p>
        {msg && fase === "pronto" && (
          <p className="mb-3 text-center text-sm text-danger">{msg}</p>
        )}
        <button
          onClick={capturar}
          disabled={fase !== "pronto" || processando}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-amber px-5 py-4 text-base font-semibold text-graphite shadow-amber-glow transition hover:bg-amber-soft active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-steel disabled:text-muted disabled:shadow-none"
        >
          {processando ? "Aguarde…" : acaoLabel}
        </button>
      </div>
    </div>
  );
}
