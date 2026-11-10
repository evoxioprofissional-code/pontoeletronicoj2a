"use client";

import { useEffect, useRef, useState } from "react";
import { carregarModelos, extrairDescritor, lerRosto } from "@/lib/face/client";
import {
  avancarProva,
  estadoInicial,
  INSTRUCAO_VIDA,
  type EtapaVida,
} from "@/lib/face/liveness";
import { AlertIcon, ArrowLeft } from "./icons";

interface Props {
  titulo: string;
  instrucao: string;
  acaoLabel: string;
  ocupado?: boolean;
  /**
   * Exige prova de vida (virar o rosto) antes de capturar — dificulta bater
   * ponto com uma foto. A captura passa a ser automática.
   */
  provaDeVida?: boolean;
  onDescritor: (descriptor: number[]) => void;
  onCancelar: () => void;
}

type Fase = "carregando" | "pronto" | "erro";

/** Tempo máximo para concluir a prova de vida antes de pedir nova tentativa. */
const TEMPO_MAX_PROVA_MS = 25000;

/** Traduz a falha de câmera/modelo em uma instrução que a pessoa consegue seguir. */
function mensagemErroCamera(e: unknown): string {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "A câmera só funciona em conexão segura (https). Abra o app pelo endereço oficial.";
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    return "Este navegador não permite usar a câmera. Abra o app no Chrome (Android) ou Safari (iPhone).";
  }
  const nome = e instanceof DOMException ? e.name : "";
  switch (nome) {
    case "NotAllowedError":
    case "SecurityError":
      return "Câmera bloqueada. Toque no cadeado ao lado do endereço do site, abra Permissões e permita a Câmera. Depois volte e tente de novo.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "Nenhuma câmera frontal encontrada neste aparelho.";
    case "NotReadableError":
    case "AbortError":
      return "A câmera está sendo usada por outro aplicativo. Feche os outros apps e tente de novo.";
    default:
      return "Não foi possível carregar o reconhecimento facial. Verifique sua internet e tente de novo.";
  }
}

export function CameraCapture({
  titulo,
  instrucao,
  acaoLabel,
  ocupado = false,
  provaDeVida = false,
  onDescritor,
  onCancelar,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [fase, setFase] = useState<Fase>("carregando");
  const [msg, setMsg] = useState<string | null>(null);
  const [capturando, setCapturando] = useState(false);
  // Trava síncrona: o estado do React só muda no próximo render, então um
  // toque duplo rápido passava duas vezes pelo "if (capturando)".
  const travaRef = useRef(false);
  const [etapa, setEtapa] = useState<EtapaVida>("frente");
  const [provaFalhou, setProvaFalhou] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const onDescritorRef = useRef(onDescritor);
  onDescritorRef.current = onDescritor;

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
      } catch (e) {
        if (cancelado) return;
        setFase("erro");
        setMsg(mensagemErroCamera(e));
      }
    }
    iniciar();
    return () => {
      cancelado = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Prova de vida: lê o rosto em laço e captura sozinho ao concluir o desafio.
  useEffect(() => {
    if (!provaDeVida || fase !== "pronto" || provaFalhou) return;
    let ativo = true;
    let estado = estadoInicial();
    const inicio = Date.now();
    setEtapa("frente");
    setMsg(null);

    async function laco() {
      while (ativo) {
        const video = videoRef.current;
        if (!video) return;
        if (Date.now() - inicio > TEMPO_MAX_PROVA_MS) {
          setProvaFalhou(true);
          return;
        }
        try {
          const leitura = await lerRosto(video);
          if (!ativo) return;
          estado = avancarProva(estado, leitura);
          setEtapa(estado.etapa);
          if (estado.reiniciou) {
            setMsg("Perdemos seu rosto de vista. Vamos recomeçar.");
          } else if (estado.etapa !== "frente") {
            setMsg(null);
          }

          if (estado.etapa === "ok") {
            travaRef.current = true;
            setCapturando(true);
            const d = await extrairDescritor(video);
            if (!ativo) return;
            if (d) {
              onDescritorRef.current(d);
              return; // o pai fecha a câmera ou mostra o erro
            }
            // Não conseguiu o descritor no quadro final: repete só o último passo.
            travaRef.current = false;
            setCapturando(false);
            estado = { ...estado, etapa: "voltar", estaveis: 0 };
            setEtapa("voltar");
          }
        } catch {
          if (!ativo) return;
          setMsg("Erro ao processar a imagem. Tentando de novo…");
        }
        // Pequena pausa para não travar celulares mais fracos.
        await new Promise((r) => setTimeout(r, 120));
      }
    }
    laco();
    return () => {
      ativo = false;
      travaRef.current = false;
      setCapturando(false);
    };
  }, [provaDeVida, fase, provaFalhou, tentativa]);

  function tentarDeNovo() {
    setProvaFalhou(false);
    setMsg(null);
    setTentativa((n) => n + 1);
  }

  async function capturar() {
    if (!videoRef.current || travaRef.current || ocupado) return;
    travaRef.current = true;
    setCapturando(true);
    setMsg(null);
    try {
      const d = await extrairDescritor(videoRef.current);
      if (!d) {
        setMsg("Rosto não detectado. Centralize o rosto no guia.");
        return;
      }
      onDescritor(d);
    } catch {
      setMsg("Erro ao processar a imagem. Tente novamente.");
    } finally {
      travaRef.current = false;
      setCapturando(false);
    }
  }

  const processando = capturando || ocupado;

  return (
    <div
      data-captura
      className="fixed inset-0 z-50 flex flex-col bg-graphite"
    >
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

          {/* Guia oval + anel de scan — grande, relativo ao viewfinder */}
          <div className="pointer-events-none absolute inset-x-[10%] top-[7%] bottom-[13%]">
            <div className="relative h-full w-full">
              {fase === "pronto" && (
                <div className="absolute inset-0 rounded-[50%] border-2 border-amber/70 animate-scan-ring" />
              )}
              <div
                className={`absolute inset-0 rounded-[50%] border-[3px] border-dashed ${
                  fase === "erro" ? "border-danger/70" : "border-ink/60"
                }`}
              />
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
        {provaDeVida && fase === "pronto" ? (
          provaFalhou ? (
            <>
              <p className="mb-3 text-center text-sm text-danger">
                Não conseguimos confirmar que é você. Fique em um lugar
                iluminado, tire boné/máscara e siga as instruções na tela.
              </p>
              <button
                onClick={tentarDeNovo}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-amber px-5 py-4 text-base font-semibold text-graphite shadow-amber-glow transition hover:bg-amber-soft active:scale-[0.99]"
              >
                Tentar novamente
              </button>
            </>
          ) : (
            <div role="status" aria-live="polite" className="text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                Passo {etapa === "frente" ? 1 : etapa === "virar" ? 2 : 3} de 3
              </p>
              <p className="text-lg font-semibold text-ink">
                {ocupado ? "Registrando seu ponto…" : INSTRUCAO_VIDA[etapa]}
              </p>
              <p className="mt-2 min-h-[1.25rem] text-sm text-danger">
                {msg ?? ""}
              </p>
            </div>
          )
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
