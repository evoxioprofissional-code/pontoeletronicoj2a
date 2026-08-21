"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CameraCapture } from "./CameraCapture";
import { PinIcon, ScanFaceIcon, CheckIcon, AlertIcon } from "./icons";
import { avaliarCerca } from "@/lib/geo";
import { rotuloTipo, type TipoDB } from "@/lib/ponto";
import { baterPonto, registrarFace } from "@/app/app/ponto-actions";

interface Cerca {
  nome: string;
  latitude: number;
  longitude: number;
  raio_metros: number;
}

interface Props {
  cerca: Cerca | null;
  temFace: boolean;
  proximoTipo: TipoDB;
}

type GeoFase = "carregando" | "ok" | "negado" | "erro";
interface GeoState {
  fase: GeoFase;
  lat?: number;
  lng?: number;
  precisao?: number;
  dentro?: boolean;
  distancia?: number;
}

export function PontoCliente({ cerca, temFace, proximoTipo }: Props) {
  const router = useRouter();
  const [geo, setGeo] = useState<GeoState>({ fase: "carregando" });
  const [modal, setModal] = useState<null | "cadastro" | "ponto">(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<null | {
    tipo: TipoDB;
    marcado_em: string;
    cerca: string;
  }>(null);

  useEffect(() => {
    if (!cerca || !("geolocation" in navigator)) {
      setGeo({ fase: "erro" });
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const r = avaliarCerca(p, cerca);
        setGeo({
          fase: "ok",
          lat: p.lat,
          lng: p.lng,
          precisao: pos.coords.accuracy,
          dentro: r.dentro,
          distancia: r.distancia,
        });
      },
      (err) => {
        setGeo({ fase: err.code === err.PERMISSION_DENIED ? "negado" : "erro" });
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [cerca]);

  const podeBater = temFace && geo.fase === "ok" && geo.dentro === true;

  async function aoCadastrar(descriptor: number[]) {
    setOcupado(true);
    setErro(null);
    const r = await registrarFace(descriptor);
    setOcupado(false);
    if ("error" in r && r.error) {
      setErro(r.error);
      return;
    }
    setModal(null);
    router.refresh();
  }

  async function aoBater(descriptor: number[]) {
    if (geo.lat == null || geo.lng == null) {
      setErro("Localização indisponível.");
      return;
    }
    setOcupado(true);
    setErro(null);
    const r = await baterPonto({
      lat: geo.lat,
      lng: geo.lng,
      precisao: geo.precisao,
      descriptor,
    });
    setOcupado(false);
    setModal(null);
    if ("error" in r && r.error) {
      setErro(r.error);
      return;
    }
    if ("ok" in r) {
      setResultado({ tipo: r.tipo, marcado_em: r.marcado_em, cerca: r.cerca });
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Geofence ao vivo */}
      <GeofenceLive cerca={cerca} geo={geo} />

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
          {!podeBater && (
            <p className="mt-2 text-center text-sm text-danger">
              {geo.fase !== "ok"
                ? "Ative a localização para bater o ponto."
                : "Aproxime-se da fábrica para registrar o ponto."}
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
          instrucao="Olhe para a câmera e mantenha-se parado."
          acaoLabel="Confirmar e bater ponto"
          ocupado={ocupado}
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

function GeofenceLive({ cerca, geo }: { cerca: Cerca | null; geo: GeoState }) {
  let dentro = false;
  let texto: string;
  if (!cerca) {
    texto = "Área da fábrica não configurada";
  } else if (geo.fase === "carregando") {
    texto = "Localizando você…";
  } else if (geo.fase === "negado") {
    texto = "Permita o acesso à localização";
  } else if (geo.fase === "erro") {
    texto = "Não foi possível obter a localização";
  } else if (geo.dentro) {
    dentro = true;
    texto = `Dentro da área — ${Math.round(geo.distancia ?? 0)} m`;
  } else {
    texto = `Fora da área permitida — ${Math.round(geo.distancia ?? 0)} m`;
  }

  return (
    <div
      className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-sm font-medium ${
        dentro
          ? "border-signal/25 bg-signal/10 text-signal"
          : geo.fase === "carregando"
            ? "border-steel-line bg-steel text-muted"
            : "border-danger/30 bg-danger/10 text-danger"
      }`}
      role="status"
    >
      <PinIcon className="h-5 w-5 shrink-0" />
      <span>{texto}</span>
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
