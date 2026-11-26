import { AppShell } from "@/components/AppShell";
import { DataExtenso, Saudacao, RelogioAnel } from "@/components/LiveClock";
import {
  PontoCliente,
  type CercaCliente,
  type GeoState,
} from "@/components/PontoCliente";
import { Grupo, LinhaGrupo, TituloSecao } from "@/components/ui";
import { CheckIcon, ListIcon, InboxIcon, CalendarIcon, TipoIcon } from "@/components/icons";
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

const STATUS_HERO = {
  off: "border-white/15 bg-white/5 text-[#C9D7DA]",
  working: "border-[#1F6B47] bg-[#123020] text-[#7DDBA3]",
  break: "border-[#6B5320] bg-[#2E2410] text-[#F5CF7A]",
} as const;
const STATUS_TXT = { off: "Fora de turno", working: "Em turno", break: "Em intervalo" } as const;

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
      <header className="mb-5 px-1 md:mb-8">
        <p className="text-[0.8125rem] text-ink-2">
          <DataExtenso />
        </p>
        <h1 className="titulo-grande mt-1 text-ink">
          <Saudacao nome={primeiroNome} />
        </h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-start lg:gap-8">
        {/* Cartão principal: relógio, localização e registrar */}
        <section
          aria-label="Registrar ponto"
          className="relative isolate overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-hero-2 to-hero p-5 text-white shadow-float sm:p-7"
        >
          {/* luz turquesa difusa atrás do relógio */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-24 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-[#2BB3C0]/20 blur-3xl"
          />
          <div className="relative">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.75rem] font-extrabold uppercase tracking-[0.05em] ${STATUS_HERO[status]}`}>
                <span className={`h-1.5 w-1.5 rounded-full bg-current ${status === "working" ? "animate-pulse-dot" : ""}`} />
                {STATUS_TXT[status]}
                {ultima && status !== "off" && (
                  <span className="font-medium opacity-75">desde {horaLocal(ultima.marcado_em)}</span>
                )}
              </span>
              <span className="text-[0.6875rem] font-extrabold uppercase tracking-[0.08em] text-[#8FA6AB]">Hoje</span>
            </div>

            <RelogioAnel marcacoes={marcacoes} cargaMin={cargaMin} inicialMin={trabalhadoMin} />

            <div className="mt-5">
              <PontoCliente
                cercas={cercas}
                temFace={temFace}
                proximoTipo={prox}
                geoDemo={geoDemo}
              />
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-6">
          {/* Linha do tempo de hoje */}
          <section>
            <TituloSecao>Marcações de hoje</TituloSecao>
            <ol className="overflow-hidden rounded-card bg-surface shadow-card">
              {passos.map((p, i) => {
                const feito = p.marcado_em !== null;
                return (
                  <li key={i} className="flex items-center gap-3.5 pl-4">
                    <span
                      aria-hidden
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        feito
                          ? "bg-brand text-on-brand"
                          : p.proximo
                            ? "border border-brand-line bg-brand-tint text-brand"
                            : "border border-line-strong bg-sunken text-ink-3"
                      }`}
                    >
                      {feito ? (
                        <CheckIcon className="h-[1.1rem] w-[1.1rem]" strokeWidth={2.6} />
                      ) : (
                        <TipoIcon tipo={p.tipo} className="h-[1.05rem] w-[1.05rem]" />
                      )}
                    </span>
                    <span className="flex min-h-[3.5rem] flex-1 items-center gap-3 border-b border-line pr-4 [li:last-child_&]:border-b-0">
                      <span className="flex-1">
                        <span className={`block text-[0.9375rem] ${feito ? "font-bold text-ink" : p.proximo ? "font-bold text-ink" : "font-medium text-ink-3"}`}>
                          {rotuloTipo(p.tipo)}
                        </span>
                        {p.proximo && <span className="block text-[0.75rem] font-semibold text-brand">Próxima marcação</span>}
                      </span>
                      <span className={`num text-[1.0625rem] ${feito ? "font-extrabold text-ink" : "text-ink-3/70"}`}>
                        {feito ? horaLocal(p.marcado_em!) : "--:--"}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* Atalhos */}
          <section>
            <TituloSecao>Atalhos</TituloSecao>
            <Grupo>
              <LinhaGrupo href="/app/registros" icone={<ListIcon className="h-[1.1rem] w-[1.1rem]" />} titulo="Meus registros" sub="Todos os dias do mês" />
              <LinhaGrupo href="/app/espelho" icone={<CalendarIcon className="h-[1.1rem] w-[1.1rem]" />} titulo="Espelho e banco de horas" sub="Saldo e folha do mês" />
              <LinhaGrupo href="/app/solicitacoes" icone={<InboxIcon className="h-[1.1rem] w-[1.1rem]" />} titulo="Pedir ajuste ao RH" sub="Esqueceu de bater ou precisa abonar" />
            </Grupo>
          </section>

        </div>
      </div>
    </AppShell>
  );
}
