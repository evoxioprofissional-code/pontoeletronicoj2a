"use client";

import { useEffect, useRef, useState } from "react";
import { CameraCapture } from "./CameraCapture";
import { PinIcon, ScanFaceIcon, CheckIcon, TipoIcon } from "./icons";
import { Aviso, botao } from "./ui";
import { melhorCerca, TOLERANCIA_GPS_MAX_M } from "@/lib/geo";
import {
  acaoTipo,
  confirmacaoTipo,
  rotuloTipo,
  type TipoDB,
} from "@/lib/ponto";
import { baterPonto, registrarFace } from "@/app/app/ponto-actions";

export interface CercaCliente {
  nome: string;
  latitude: number;
  longitude: number;
  raio_metros: number;
}

export type GeoFase =
  | "carregando"
  | "ok"
  | "negado" // permissão de localização bloqueada
  | "indisponivel" // GPS desligado / sem sinal
  | "demorou" // tempo esgotado esperando o GPS
  | "sem_suporte" // navegador sem geolocalização ou sem https
  | "sem_cerca"; // empresa sem área cadastrada

export interface GeoState {
  fase: GeoFase;
  lat?: number;
  lng?: number;
  precisao?: number;
  dentro?: boolean;
  distancia?: number;
  raio?: number;
  local?: string;
}

export interface ResultadoPonto {
  tipo: TipoDB;
  marcado_em: string;
  cerca: string;
}

interface Props {
  cercas: CercaCliente[];
  temFace: boolean;
  proximoTipo: TipoDB;
  /** Só para pré-visualização de layout: fixa a localização e não usa o GPS. */
  geoDemo?: GeoState;
}

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
    acao: "Peça ao RH para cadastrar o local no Painel do RH, em Local da fábrica.",
  },
};

const ERRO_REDE =
  "Sem conexão com o servidor. Verifique sua internet e tente de novo. Se continuar, feche e abra o app.";

export function PontoCliente({ cercas, temFace, proximoTipo, geoDemo }: Props) {
  const [geo, setGeo] = useState<GeoState>(geoDemo ?? { fase: "carregando" });
  const [modal, setModal] = useState<null | "cadastro" | "ponto">(null);
  const [ocupado, setOcupado] = useState(false);
  // Trava síncrona contra envio duplo (o estado só muda no próximo render).
  const enviandoRef = useRef(false);
  const [tentativaGeo, setTentativaGeo] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoPonto | null>(null);

  useEffect(() => {
    if (geoDemo) return;
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
          local: r?.cerca.nome,
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
  }, [JSON.stringify(cercas), tentativaGeo, geoDemo]);

  const podeBater = temFace && geo.fase === "ok" && geo.dentro === true;

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
      setModal(null);
      setErro("Localização indisponível. Aguarde o GPS e tente de novo.");
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
      // Sem internet, ou o app foi atualizado enquanto estava aberto.
      setErro(ERRO_REDE);
    } finally {
      enviandoRef.current = false;
      setOcupado(false);
      setModal(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Localizacao geo={geo} onTentar={() => setTentativaGeo((n) => n + 1)} />

      {temFace ? (
        <>
          <button
            type="button"
            onClick={() => {
              setErro(null);
              setModal("ponto");
            }}
            disabled={!podeBater}
            className={botao("primario", "lg", "w-full")}
          >
            <TipoIcon tipo={proximoTipo} className="h-5 w-5" />
            {acaoTipo(proximoTipo)}
          </button>
          <p className="text-center text-sm text-ink-3">
            {podeBater
              ? "Vamos confirmar seu rosto antes de registrar."
              : geo.fase === "carregando"
                ? "O botão libera assim que acharmos sua localização."
                : geo.fase === "ok"
                  ? "O botão libera quando você estiver dentro da área da fábrica."
                  : "O botão libera quando a localização estiver funcionando."}
          </p>
        </>
      ) : (
        <div className="rounded-lg border border-brand-line bg-brand-tint p-4">
          <p className="mb-1 font-semibold text-ink">Cadastre seu rosto</p>
          <p className="mb-3 text-sm text-ink-2">
            É só uma vez. Depois disso você registra o ponto olhando para a
            câmera.
          </p>
          <button
            type="button"
            onClick={() => {
              setErro(null);
              setModal("cadastro");
            }}
            className={botao("primario", "lg", "w-full")}
          >
            <ScanFaceIcon className="h-5 w-5" />
            Cadastrar meu rosto
          </button>
        </div>
      )}

      {erro && <Aviso tom="erro">{erro}</Aviso>}

      {modal === "cadastro" && (
        <CameraCapture
          titulo="Cadastrar rosto"
          instrucao="Centralize o rosto na moldura, em um lugar bem iluminado."
          acaoLabel="Cadastrar rosto"
          ocupado={ocupado}
          onDescritor={aoCadastrar}
          onCancelar={() => setModal(null)}
        />
      )}
      {modal === "ponto" && (
        <CameraCapture
          titulo={acaoTipo(proximoTipo)}
          instrucao="Siga as instruções na tela."
          acaoLabel="Confirmar"
          ocupado={ocupado}
          provaDeVida
          onDescritor={aoBater}
          onCancelar={() => setModal(null)}
        />
      )}

      {resultado && (
        <Comprovante
          resultado={resultado}
          onFechar={() => setResultado(null)}
        />
      )}
    </div>
  );
}

/** Faixa de localização: diz onde a pessoa está e o que fazer se algo falhar. */
function Localizacao({
  geo,
  onTentar,
}: {
  geo: GeoState;
  onTentar: () => void;
}) {
  if (geo.fase === "carregando") {
    return (
      <div
        role="status"
        className="flex items-center gap-2.5 rounded-lg border border-line bg-paper px-3.5 py-3 text-sm text-ink-2"
      >
        <span className="h-2 w-2 animate-pulse-dot rounded-full bg-brand" />
        Procurando sua localização…
      </div>
    );
  }

  if (geo.fase === "ok") {
    const dist = Math.round(geo.distancia ?? 0);
    const precisao = Math.round(geo.precisao ?? 0);
    const sinalFraco = !geo.dentro && precisao > TOLERANCIA_GPS_MAX_M;
    return (
      <div
        role="status"
        className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm ${
          geo.dentro
            ? "border-ok-line bg-ok-tint text-ok"
            : "border-danger-line bg-danger-tint text-danger"
        }`}
      >
        <PinIcon className="mt-0.5 h-[1.125rem] w-[1.125rem] shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            {geo.dentro
              ? `Você está em ${geo.local ?? "área permitida"}`
              : `Fora da área — a ${dist} m da fábrica`}
          </p>
          <p className="mt-0.5 text-[0.8125rem] opacity-90">
            {geo.dentro
              ? `Precisão do GPS: ±${precisao} m`
              : sinalFraco
                ? `Sinal de GPS fraco (±${precisao} m). Vá para perto de uma porta ou janela.`
                : `O limite é ${geo.raio ?? "?"} m. Precisão do GPS: ±${precisao} m.`}
          </p>
        </div>
      </div>
    );
  }

  const ajuda = GEO_AJUDA[geo.fase];
  const podeTentar = geo.fase !== "sem_cerca" && geo.fase !== "sem_suporte";
  return (
    <Aviso tom="erro">
      <p className="font-semibold">{ajuda.titulo}</p>
      <p className="mt-0.5">{ajuda.acao}</p>
      {podeTentar && (
        <button
          type="button"
          onClick={onTentar}
          className="mt-2 rounded-md border border-danger-line bg-surface px-3 py-1.5 text-sm font-semibold text-danger"
        >
          Tentar novamente
        </button>
      )}
    </Aviso>
  );
}

const DATA_COMPROVANTE = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const HORA_COMPROVANTE = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function LinhaComprovante({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-baseline gap-2 py-1.5">
      <dt className="text-sm text-ink-3">{rotulo}</dt>
      <span
        aria-hidden
        className="mb-1 flex-1 border-b border-dotted border-line-strong"
      />
      <dd className="num text-right text-sm font-medium text-ink">{valor}</dd>
    </div>
  );
}

/** Tela de confirmação, com cara de comprovante de papel. */
export function Comprovante({
  resultado,
  onFechar,
}: {
  resultado: ResultadoPonto;
  onFechar: () => void;
}) {
  const d = new Date(resultado.marcado_em);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="comprovante-titulo"
      className="app-gutter fixed inset-0 z-50 flex flex-col items-center overflow-y-auto overscroll-contain bg-paper pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]"
    >
      <div className="my-auto w-full max-w-sm shrink-0 animate-fade-up">
        <div className="mb-5 flex flex-col items-center text-center">
          <span className="mb-4 flex h-14 w-14 animate-check-in items-center justify-center rounded-full bg-ok text-white">
            <CheckIcon className="h-8 w-8" strokeWidth={2.4} />
          </span>
          <h2
            id="comprovante-titulo"
            className="text-xl font-semibold text-ink"
          >
            {confirmacaoTipo(resultado.tipo)}
          </h2>
          <p className="num mt-1 text-[2.75rem] font-medium leading-none text-ink">
            {HORA_COMPROVANTE.format(d).slice(0, 5)}
          </p>
        </div>

        <div className="rounded-xl border border-line bg-surface px-5 py-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-3">
            Comprovante
          </p>
          <dl>
            <LinhaComprovante rotulo="Tipo" valor={rotuloTipo(resultado.tipo)} />
            <LinhaComprovante rotulo="Data" valor={DATA_COMPROVANTE.format(d)} />
            <LinhaComprovante rotulo="Hora" valor={HORA_COMPROVANTE.format(d)} />
            <LinhaComprovante rotulo="Local" valor={resultado.cerca} />
            <LinhaComprovante rotulo="Verificação" valor="Rosto + GPS" />
          </dl>
        </div>

        <button
          type="button"
          onClick={onFechar}
          autoFocus
          className={botao("primario", "lg", "mt-5 w-full")}
        >
          Concluir
        </button>
      </div>
    </div>
  );
}
