import { AppShell } from "@/components/AppShell";
import {
  LiveClock,
  DataExtenso,
  Saudacao,
  HorasHoje,
} from "@/components/LiveClock";
import {
  PontoCliente,
  type CercaCliente,
  type GeoState,
} from "@/components/PontoCliente";
import { Cartao, StatusJornada, TituloSecao } from "@/components/ui";
import { CheckIcon } from "@/components/icons";
import {
  proximoTipo,
  statusDe,
  passosDoDia,
  rotuloTipo,
  horaLocal,
  type MarcacaoLite,
} from "@/lib/ponto";

export interface HomeViewProps {
  nome: string;
  gestor: boolean;
  cercas: CercaCliente[];
  temFace: boolean;
  marcacoes: MarcacaoLite[];
  cargaMin: number;
  trabalhadoMin: number;
  geoDemo?: GeoState;
}

export function HomeView({
  nome,
  gestor,
  cercas,
  temFace,
  marcacoes,
  cargaMin,
  trabalhadoMin,
  geoDemo,
}: HomeViewProps) {
  const tipos = marcacoes.map((m) => m.tipo);
  const status = statusDe(tipos);
  const prox = proximoTipo(tipos);
  const ultima = marcacoes[marcacoes.length - 1];
  const passos = passosDoDia(marcacoes);
  const primeiroNome = nome.trim().split(/\s+/)[0];

  return (
    <AppShell nome={nome} gestor={gestor} abaAtiva="/app">
      <header className="mb-5 md:mb-7">
        <p className="text-sm text-ink-3">
          <DataExtenso />
        </p>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-ink md:text-[1.75rem]">
          <Saudacao nome={primeiroNome} />
        </h1>
      </header>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start lg:gap-6">
        {/* Relógio + registrar */}
        <Cartao className="p-5 sm:p-6">
          <div className="mb-4 flex justify-center">
            <StatusJornada
              status={status}
              desde={ultima ? horaLocal(ultima.marcado_em) : null}
            />
          </div>
          <LiveClock />
          <div className="mt-6">
            <PontoCliente
              cercas={cercas}
              temFace={temFace}
              proximoTipo={prox}
              geoDemo={geoDemo}
            />
          </div>
        </Cartao>

        <div className="flex flex-col gap-4 lg:gap-6">
          {/* Linha do tempo de hoje */}
          <Cartao className="p-5 sm:p-6">
            <TituloSecao>Hoje</TituloSecao>
            <ol>
              {passos.map((p, i) => {
                const feito = p.marcado_em !== null;
                const ultimo = i === passos.length - 1;
                return (
                  <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
                    {!ultimo && (
                      <span
                        aria-hidden
                        className={`absolute left-[0.6875rem] top-6 h-[calc(100%-1.5rem)] w-px ${
                          feito ? "bg-brand" : "bg-line-strong"
                        }`}
                      />
                    )}
                    <span
                      aria-hidden
                      className={`relative z-10 mt-0.5 flex h-[1.375rem] w-[1.375rem] shrink-0 items-center justify-center rounded-full ${
                        feito
                          ? "bg-brand text-white"
                          : p.proximo
                            ? "border-2 border-brand bg-surface"
                            : "border-2 border-line-strong bg-surface"
                      }`}
                    >
                      {feito && <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.6} />}
                    </span>
                    <span
                      className={`flex-1 text-[0.9375rem] ${
                        feito
                          ? "font-medium text-ink"
                          : p.proximo
                            ? "font-medium text-brand"
                            : "text-ink-3"
                      }`}
                    >
                      {rotuloTipo(p.tipo)}
                      {p.proximo && (
                        <span className="block text-xs font-normal text-ink-3">
                          próxima marcação
                        </span>
                      )}
                    </span>
                    <span
                      className={`num text-[0.9375rem] ${
                        feito ? "font-medium text-ink" : "text-ink-3"
                      }`}
                    >
                      {feito ? horaLocal(p.marcado_em!) : "--:--"}
                    </span>
                  </li>
                );
              })}
            </ol>
          </Cartao>

          {/* Jornada */}
          <Cartao className="p-5 sm:p-6">
            <TituloSecao>Horas trabalhadas</TituloSecao>
            <HorasHoje
              marcacoes={marcacoes}
              cargaMin={cargaMin}
              inicialMin={trabalhadoMin}
            />
          </Cartao>
        </div>
      </div>
    </AppShell>
  );
}
