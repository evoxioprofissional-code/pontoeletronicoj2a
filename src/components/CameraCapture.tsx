"use client";

import { useEffect, useRef, useState } from "react";
import { carregarModelos, extrairDescritor, lerRosto } from "@/lib/face/client";
import {
  avancarProva,
  estadoInicial,
  INSTRUCAO_VIDA,
  type EtapaVida,
} from "@/lib/face/liveness";
import { AlertIcon, XIcon } from "./icons";
import { botao } from "./ui";

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

const PASSO: Record<EtapaVida, number> = { frente: 1, virar: 2, voltar: 3, ok: 3 };

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
        setMsg("Rosto não detectado. Centralize o rosto na moldura.");
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
  const passo = PASSO[etapa];

  return (
    <div
      data-captura
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      className="safe-t fixed inset-0 z-50 flex flex-col bg-paper"
    >
      {/* Topo */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-surface px-4">
        <h1 className="text-base font-semibold text-ink">{titulo}</h1>
        <button
          type="button"
          onClick={onCancelar}
          className="-mr-2 flex h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-ink-2 hover:bg-paper"
        >
          <XIcon className="h-5 w-5" />
          Cancelar
        </button>
      </div>

      {/* Câmera */}
      <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col px-4 pt-4">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl bg-ink">
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full scale-x-[-1] object-cover"
          />

          {/* Moldura oval do rosto */}
          {fase !== "erro" && (
            <div className="pointer-events-none absolute inset-x-[12%] bottom-[12%] top-[8%]">
              <div
                className={`h-full w-full rounded-[50%] border-2 ${
                  etapa === "ok" || (processando && fase === "pronto")
                    ? "border-ok"
                    : "border-white/80"
                }`}
              />
            </div>
          )}

          {fase === "carregando" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="flex gap-1.5">
                <span className="h-2 w-2 animate-pulse-dot rounded-full bg-white" />
                <span className="h-2 w-2 animate-pulse-dot rounded-full bg-white [animation-delay:200ms]" />
                <span className="h-2 w-2 animate-pulse-dot rounded-full bg-white [animation-delay:400ms]" />
              </div>
              <p className="text-sm text-white/80">Abrindo a câmera…</p>
            </div>
          )}

          {fase === "erro" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <AlertIcon className="h-8 w-8 text-white" />
              <p className="text-sm leading-relaxed text-white">{msg}</p>
            </div>
          )}

          {processando && fase === "pronto" && (
            <p className="absolute inset-x-0 bottom-0 bg-ink/70 px-4 py-2.5 text-center text-sm font-medium text-white">
              {ocupado ? "Registrando…" : "Lendo seu rosto…"}
            </p>
          )}
        </div>
      </div>

      {/* Instruções / ação */}
      <div className="safe-b mx-auto w-full max-w-md shrink-0 px-4 pt-4">
        <div className="pb-3">
          {fase === "erro" ? (
            <button
              type="button"
              onClick={onCancelar}
              className={botao("secundario", "lg", "w-full")}
            >
              Voltar
            </button>
          ) : provaDeVida ? (
            provaFalhou ? (
              <>
                <p className="mb-3 text-center text-sm text-danger">
                  Não conseguimos confirmar que é você. Fique em um lugar
                  iluminado, tire boné ou máscara e siga as instruções.
                </p>
                <button
                  type="button"
                  onClick={tentarDeNovo}
                  className={botao("primario", "lg", "w-full")}
                >
                  Tentar novamente
                </button>
              </>
            ) : (
              <div role="status" aria-live="polite" className="text-center">
                <div
                  className="mx-auto mb-3 flex max-w-[12rem] gap-1.5"
                  aria-hidden
                >
                  {[1, 2, 3].map((n) => (
                    <span
                      key={n}
                      className={`h-1 flex-1 rounded-full ${
                        fase === "pronto" && n <= passo ? "bg-brand" : "bg-line"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-ink-3">
                  {fase === "pronto" ? `Passo ${passo} de 3` : "Preparando…"}
                </p>
                <p className="mt-0.5 text-lg font-semibold text-ink">
                  {fase !== "pronto"
                    ? "Aguarde a câmera abrir"
                    : ocupado
                      ? "Registrando seu ponto…"
                      : INSTRUCAO_VIDA[etapa]}
                </p>
                <p className="mt-1 min-h-[1.25rem] text-sm text-danger">
                  {fase === "pronto" ? (msg ?? "") : ""}
                </p>
              </div>
            )
          ) : (
            <>
              <p className="mb-3 text-center text-sm text-ink-2">{instrucao}</p>
              {msg && fase === "pronto" && (
                <p className="mb-3 text-center text-sm text-danger">{msg}</p>
              )}
              <button
                type="button"
                onClick={capturar}
                disabled={fase !== "pronto" || processando}
                className={botao("primario", "lg", "w-full")}
              >
                {processando ? "Aguarde…" : acaoLabel}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
