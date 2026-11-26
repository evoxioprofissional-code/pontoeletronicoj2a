"use client";

import { useEffect, useRef, useState } from "react";
import { CameraCapture } from "./CameraCapture";
import { PinIcon, ScanFaceIcon, CheckIcon, TipoIcon } from "./icons";
import { Aviso, botao } from "./ui";
import { TelaCheia } from "./TelaCheia";
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

// Peças sobre o cartão escuro da tela inicial.
const CHIP = "flex items-center gap-2.5 rounded-[13px] border border-white/10 bg-white/[0.05] px-3.5 py-3 text-[0.875rem] text-white";


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
            className="toque mt-1 flex min-h-[3.25rem] w-full items-center justify-center gap-2.5 rounded-[0.8rem] bg-[#2BB3C0] text-[0.9375rem] font-extrabold text-[#04191C] hover:bg-[#3CC6D3] disabled:bg-white/10 disabled:text-white/40"
          >
            <TipoIcon tipo={proximoTipo} className="h-5 w-5" strokeWidth={2.2} />
            {acaoTipo(proximoTipo)}
          </button>
          <p className="text-center text-[0.75rem] text-[#8FA6AB]">
            {podeBater
              ? "Vamos confirmar seu rosto antes de registrar."
              : geo.fase === "carregando"
                ? "O botão libera assim que acharmos sua localização."
                : geo.fase === "ok"
                  ? (geo.precisao ?? 0) > TOLERANCIA_GPS_MAX_M
                    ? "O botão libera assim que o GPS ficar preciso."
                    : "O botão libera quando você estiver dentro da área da fábrica."
                  : "O botão libera quando a localização estiver funcionando."}
          </p>
        </>
      ) : (
        <div className="mt-1 rounded-[13px] border border-white/10 bg-white/[0.05] p-4 text-white">
          <p className="mb-1 font-semibold">Cadastre seu rosto</p>
          <p className="mb-3 text-sm text-white/70">
            É só uma vez. Depois disso você registra o ponto olhando para a
            câmera.
          </p>
          <button
            type="button"
            onClick={() => {
              setErro(null);
              setModal("cadastro");
            }}
            className="toque flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-[0.8rem] bg-[#2BB3C0] text-[0.9375rem] font-extrabold text-[#04191C]"
          >
            <ScanFaceIcon className="h-5 w-5" />
            Cadastrar meu rosto
          </button>
        </div>
      )}

      {erro && (
        <div role="alert" className="flex items-start gap-2.5 rounded-[13px] border border-[#6B2E2E] bg-[#3A1C1C] px-4 py-3 text-[0.875rem] text-[#FFC9C4]">
          <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#FF8A80]" />
          <span>{erro}</span>
        </div>
      )}

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
      <div role="status" className={CHIP}>
        <span className="h-2 w-2 animate-pulse-dot rounded-full bg-white" />
        <span className="text-white/80">Procurando sua localização…</span>
      </div>
    );
  }

  if (geo.fase === "ok") {
    const dist = Math.round(geo.distancia ?? 0);
    const precisao = Math.round(geo.precisao ?? 0);
    // GPS impreciso: não afirmamos "fora da área" — o iPhone costuma mandar
    // primeiro uma posição aproximada (ou sempre, com a Localização Precisa
    // desligada) e só depois a exata.
    const impreciso = !geo.dentro && precisao > TOLERANCIA_GPS_MAX_M;
    const aproximada = !geo.dentro && precisao > 500;
    const tom = geo.dentro
      ? "bg-[#123020] text-[#7DDBA3]"
      : impreciso
        ? "bg-white/10 text-white"
        : "bg-[#3A1C1C] text-[#FF9C93]";
    return (
      <div role="status" className={`${CHIP} items-start`}>
        <span
          aria-hidden
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${tom}`}
        >
          {impreciso && !aproximada ? (
            <span className="h-2 w-2 animate-pulse-dot rounded-full bg-white" />
          ) : (
            <PinIcon className="h-3.5 w-3.5" strokeWidth={2.4} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-snug">
            {geo.dentro
              ? `Você está em ${geo.local ?? "área permitida"}`
              : aproximada
                ? "Sua localização está aproximada"
                : impreciso
                  ? "Melhorando a precisão do GPS…"
                  : `Fora da área — a ${dist} m da fábrica`}
          </p>
          <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-white/65">
            {geo.dentro
              ? `Precisão do GPS: ±${precisao} m`
              : aproximada
                ? "No iPhone: Ajustes › Privacidade › Serviços de Localização › Safari (ou o app) › ative “Localização Precisa”. No Android: ative o GPS em alta precisão."
                : impreciso
                  ? `Precisão atual ±${precisao} m. Aguarde alguns segundos, de preferência perto de uma porta ou janela.`
                  : `O limite é ${geo.raio ?? "?"} m. Precisão do GPS: ±${precisao} m.`}
          </p>
        </div>
      </div>
    );
  }

  const ajuda = GEO_AJUDA[geo.fase];
  const podeTentar = geo.fase !== "sem_cerca" && geo.fase !== "sem_suporte";
  return (
    <div role="alert" className={`${CHIP} items-start`}>
      <span aria-hidden className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3A1C1C] text-[#FF9C93]">
        <PinIcon className="h-3.5 w-3.5" strokeWidth={2.4} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-snug">{ajuda.titulo}</p>
        <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-white/70">{ajuda.acao}</p>
        {podeTentar && (
          <button
            type="button"
            onClick={onTentar}
            className="toque mt-2.5 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-[0.75rem] font-bold text-white"
          >
            Tentar novamente
          </button>
        )}
      </div>
    </div>
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
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-3 last:border-b-0">
      <dt className="text-[0.9375rem] text-ink-3">{rotulo}</dt>
      <dd className="num text-right text-[0.9375rem] font-medium text-ink">{valor}</dd>
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
    <TelaCheia>
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="comprovante-titulo"
      className="app-gutter fixed inset-0 z-50 flex flex-col items-center overflow-y-auto overscroll-contain bg-paper/95 backdrop-blur-xl pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]"
    >
      <div className="my-auto w-full max-w-sm shrink-0 animate-fade-up">
        <div className="mb-5 flex flex-col items-center text-center">
          <span className="relative mb-5 flex h-20 w-20 items-center justify-center">
            <span aria-hidden className="absolute inset-0 animate-respirar rounded-full bg-ok" />
            <span className="relative flex h-20 w-20 animate-check-in items-center justify-center rounded-full bg-ok text-white">
              <CheckIcon className="h-10 w-10" strokeWidth={2.6} />
            </span>
          </span>
          <h2 id="comprovante-titulo" className="text-[1.375rem] font-semibold tracking-[-0.02em] text-ink">
            {confirmacaoTipo(resultado.tipo)}
          </h2>
          <p className="num mt-1.5 text-[3.5rem] font-semibold leading-none tracking-[-0.04em] text-ink">
            {HORA_COMPROVANTE.format(d).slice(0, 5)}
          </p>
        </div>

        <div className="rounded-card bg-surface px-5 pb-2 pt-4 shadow-card">
          <p className="text-[0.8125rem] font-semibold text-ink-3">
            Comprovante de registro
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
    </TelaCheia>
  );
}
