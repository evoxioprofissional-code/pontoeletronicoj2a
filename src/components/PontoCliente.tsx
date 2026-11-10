"use client";

import { useEffect, useRef, useState } from "react";
import { CameraCapture } from "./CameraCapture";
import { PinIcon, ScanFaceIcon, CheckIcon, AlertIcon } from "./icons";
import { melhorCerca, TOLERANCIA_GPS_MAX_M } from "@/lib/geo";
import { rotuloTipo, type TipoDB } from "@/lib/ponto";
import { baterPonto, registrarFace } from "@/app/app/ponto-actions";

export interface CercaCliente {
  nome: string;
  latitude: number;
  longitude: number;
  raio_metros: number;
}

interface Props {
  cercas: CercaCliente[];
  temFace: boolean;
  proximoTipo: TipoDB;
}

type GeoFase =
  | "carregando"
  | "ok"
  | "negado" // permissão de localização bloqueada
  | "indisponivel" // GPS desligado / sem sinal
  | "demorou" // tempo esgotado esperando o GPS
  | "sem_suporte" // navegador sem geolocalização ou sem https
  | "sem_cerca"; // empresa sem área cadastrada

/** O que mostrar e o que a pessoa deve FAZER em cada falha de localização. */
const GEO_AJUDA: Record<
  Exclude<GeoFase, "carregando" | "ok">,
  { titulo: string; acao: string }
> = {
  negado: {
    titulo: "Localização bloqueada",
    acao: "Toque no cadeado ao lado do endereço do site, abra Permissões e permita a Localização. Depois toque em Tentar novamente.",
  },
  indisponivel: {
    titulo: "GPS desligado ou sem sinal",
    acao: "Ative a Localização (GPS) nas configurações do celular e vá para perto de uma porta ou janela.",
  },
  demorou: {
    titulo: "O GPS está demorando",
    acao: "Vá para perto de uma porta ou janela e aguarde alguns segundos. Continuamos tentando.",
  },
  sem_suporte: {
    titulo: "Localização indisponível neste navegador",
    acao: "Abra o app pelo Chrome (Android) ou Safari (iPhone), no endereço oficial (https).",
  },
  sem_cerca: {
    titulo: "Área da fábrica não configurada",
    acao: "Peça ao RH para cadastrar o local em Painel do administrador → Cerca virtual.",
  },
};
interface GeoState {
  fase: GeoFase;
  lat?: number;
  lng?: number;
  precisao?: number;
  dentro?: boolean;
  distancia?: number;
  raio?: number;
}

export function PontoCliente({ cercas, temFace, proximoTipo }: Props) {
  const [geo, setGeo] = useState<GeoState>({ fase: "carregando" });
  const [modal, setModal] = useState<null | "cadastro" | "ponto">(null);
  const [ocupado, setOcupado] = useState(false);
  // Trava síncrona contra envio duplo (o estado só muda no próximo render).
  const enviandoRef = useRef(false);
  const [tentativaGeo, setTentativaGeo] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<null | {
    tipo: TipoDB;
    marcado_em: string;
    cerca: string;
  }>(null);

  useEffect(() => {
    if (cercas.length === 0) {
      setGeo({ fase: "sem_cerca" });
      return;
    }
    if (!("geolocation" in navigator) || !window.isSecureContext) {
      setGeo({ fase: "sem_suporte" });
      return;
    }
    setGeo({ fase: "carregando" });
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const r = melhorCerca(p, cercas, pos.coords.accuracy);
        setGeo({
          fase: "ok",
          lat: p.lat,
          lng: p.lng,
          precisao: pos.coords.accuracy,
          dentro: r?.dentro ?? false,
          distancia: r?.distancia,
          raio: r?.cerca.raio_metros,
        });
      },
      (err) => {
        // Mantém a última posição boa se for só uma oscilação do GPS.
        setGeo((g) => {
          if (err.code === err.PERMISSION_DENIED) return { fase: "negado" };
          if (g.fase === "ok") return g;
          return {
            fase: err.code === err.TIMEOUT ? "demorou" : "indisponivel",
          };
        });
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
    // cercas vem do servidor; a chave evita reiniciar o GPS a cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(cercas), tentativaGeo]);

  const podeBater = temFace && geo.fase === "ok" && geo.dentro === true;

  // Permite acionar o fluxo pela barra inferior (botão central).
  useEffect(() => {
    const handler = () => {
      setErro(null);
      if (!temFace) return setModal("cadastro");
      if (podeBater) return setModal("ponto");
      setErro(motivoBloqueio(geo));
    };
    window.addEventListener("j2a:bater", handler);
    return () => window.removeEventListener("j2a:bater", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temFace, podeBater, geo.fase, geo.dentro]);

  async function aoCadastrar(descriptor: number[]) {
    if (enviandoRef.current) return;
    enviandoRef.current = true;
    setOcupado(true);
    setErro(null);
    try {
      const r = await registrarFace(descriptor);
      if ("error" in r && r.error) {
        setErro(r.error);
        return;
      }
      setModal(null);
    } catch {
      setModal(null);
      setErro(ERRO_REDE);
    } finally {
      enviandoRef.current = false;
      setOcupado(false);
    }
  }

  async function aoBater(descriptor: number[]) {
    if (geo.lat == null || geo.lng == null) {
      setErro("Localização indisponível.");
      return;
    }
    if (enviandoRef.current) return;
    enviandoRef.current = true;
    setOcupado(true);
    setErro(null);
    try {
      const r = await baterPonto({
        lat: geo.lat,
        lng: geo.lng,
        precisao: geo.precisao,
        descriptor,
      });
      if ("error" in r && r.error) {
        setErro(r.error);
        return;
      }
      if ("ok" in r) {
        // Sem router.refresh(): o revalidatePath("/app") da server action já
        // devolve a página atualizada na mesma resposta.
        setResultado({ tipo: r.tipo, marcado_em: r.marcado_em, cerca: r.cerca });
      }
    } catch {
      // Sem internet, ou o app foi atualizado enquanto estava aberto. Antes
      // isso deixava a tela travada em "Aguarde…" sem dizer nada.
      setErro(ERRO_REDE);
    } finally {
      enviandoRef.current = false;
      setOcupado(false);
      setModal(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Geofence ao vivo */}
      <GeofenceLive
        geo={geo}
        onTentar={() => setTentativaGeo((n) => n + 1)}
      />

      {/* Cadastro facial pendente */}
      {!temFace && (
        <div className="rounded-2xl border border-amber/25 bg-amber/5 p-4">
          <p className="mb-3 text-sm text-amber">
            Cadastre seu rosto para poder bater o ponto por reconhecimento facial.
          </p>
          <button
            onClick={() => {
              setErro(null);
              setModal("cadastro");
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber px-5 py-4 text-base font-semibold text-graphite shadow-amber-glow transition hover:bg-amber-soft active:scale-[0.99]"
          >
            <ScanFaceIcon className="h-5 w-5" />
            Cadastrar meu rosto
          </button>
        </div>
      )}

      {/* Bater ponto */}
      {temFace && (
        <div>
          <button
            onClick={() => {
              setErro(null);
              setModal("ponto");
            }}
            disabled={!podeBater}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber px-5 py-5 text-lg font-semibold text-graphite shadow-amber-glow transition hover:bg-amber-soft active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-steel disabled:text-muted disabled:shadow-none"
          >
            <ScanFaceIcon className="h-6 w-6" />
            Bater Ponto
            <span className="ml-1 rounded-md bg-graphite/20 px-2 py-0.5 font-mono text-xs">
              {rotuloTipo(proximoTipo)}
            </span>
          </button>
          {!podeBater && geo.fase !== "carregando" && (
            <p className="mt-2 text-center text-sm text-danger">
              {motivoBloqueio(geo)}
            </p>
          )}
        </div>
      )}

      {erro && (
        <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-3 text-sm text-danger">
          <AlertIcon className="h-5 w-5 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {/* Câmera */}
      {modal === "cadastro" && (
        <CameraCapture
          titulo="Cadastrar rosto"
          instrucao="Centralize o rosto no guia, com boa iluminação."
          acaoLabel="Cadastrar rosto"
          ocupado={ocupado}
          onDescritor={aoCadastrar}
          onCancelar={() => setModal(null)}
        />
      )}
      {modal === "ponto" && (
        <CameraCapture
          titulo="Reconhecimento facial"
          instrucao="Siga as instruções na tela."
          acaoLabel="Confirmar e bater ponto"
          ocupado={ocupado}
          provaDeVida
          onDescritor={aoBater}
          onCancelar={() => setModal(null)}
        />
      )}

      {/* Confirmação com carimbo */}
      {resultado && (
        <StampConfirm
          resultado={resultado}
          onFechar={() => setResultado(null)}
        />
      )}
    </div>
  );
}

const ERRO_REDE =
  "Sem conexão com o servidor. Verifique sua internet e tente de novo. Se continuar, feche e abra o app.";

/** Frase curta explicando por que o botão de bater ponto está bloqueado. */
function motivoBloqueio(geo: GeoState): string {
  if (geo.fase === "carregando") return "Aguarde, localizando você…";
  if (geo.fase === "ok") {
    return geo.dentro
      ? ""
      : `Você está a ${Math.round(geo.distancia ?? 0)} m do centro da fábrica (o limite é ${geo.raio ?? "?"} m). Aproxime-se para registrar.`;
  }
  return GEO_AJUDA[geo.fase].titulo + ". " + GEO_AJUDA[geo.fase].acao;
}

function GeofenceLive({
  geo,
  onTentar,
}: {
  geo: GeoState;
  onTentar: () => void;
}) {
  let dentro = false;
  let texto: string;
  let detalhe: string | null = null;
  let podeTentar = false;

  if (geo.fase === "carregando") {
    texto = "Localizando você…";
  } else if (geo.fase === "ok") {
    detalhe = `GPS ±${Math.round(geo.precisao ?? 0)} m · raio da área ${geo.raio ?? "?"} m`;
    if (geo.dentro) {
      dentro = true;
      texto = `Dentro da área — ${Math.round(geo.distancia ?? 0)} m`;
    } else {
      texto = `Fora da área permitida — ${Math.round(geo.distancia ?? 0)} m`;
      if ((geo.precisao ?? 0) > TOLERANCIA_GPS_MAX_M) {
        detalhe += " — sinal fraco, vá para perto de uma janela/porta";
      }
    }
  } else {
    texto = GEO_AJUDA[geo.fase].titulo;
    detalhe = GEO_AJUDA[geo.fase].acao;
    podeTentar = geo.fase !== "sem_cerca" && geo.fase !== "sem_suporte";
  }

  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm font-medium ${
        dentro
          ? "border-signal/25 bg-signal/10 text-signal"
          : geo.fase === "carregando"
            ? "border-steel-line bg-steel text-muted"
            : "border-danger/30 bg-danger/10 text-danger"
      }`}
      role="status"
    >
      <PinIcon className="mt-0.5 h-5 w-5 shrink-0" />
      <span className="flex flex-1 flex-col gap-1">
        <span>{texto}</span>
        {detalhe && (
          <span className="text-xs font-normal opacity-80">{detalhe}</span>
        )}
        {podeTentar && (
          <button
            type="button"
            onClick={onTentar}
            className="mt-1 self-start rounded-lg bg-danger/15 px-3 py-1.5 text-xs font-semibold text-danger ring-1 ring-danger/40"
          >
            Tentar novamente
          </button>
        )}
      </span>
    </div>
  );
}

function StampConfirm({
  resultado,
  onFechar,
}: {
  resultado: { tipo: TipoDB; marcado_em: string; cerca: string };
  onFechar: () => void;
}) {
  const d = new Date(resultado.marcado_em);
  const hora = `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-graphite px-6 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-signal">
        Ponto registrado
      </p>

      <div className="relative flex h-64 w-64 items-center justify-center">
        <div className="stamp-el pointer-events-none absolute inset-6 rounded-[50%] border-2 border-amber/50 animate-stamp-ripple" />
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
                {rotuloTipo(resultado.tipo)}
              </p>
              <p className="font-mono text-2xl font-bold tabular-nums text-ink">
                {hora}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-signal">
        <PinIcon className="h-4 w-4" />
        <span className="text-sm font-medium">
          {resultado.cerca} — dentro da área
        </span>
      </div>

      <button
        onClick={onFechar}
        className="mt-2 w-full max-w-xs rounded-2xl bg-amber px-5 py-4 text-base font-semibold text-graphite shadow-amber-glow transition hover:bg-amber-soft active:scale-[0.99]"
      >
        Concluir
      </button>
    </div>
  );
}
