import Link from "next/link";
import { CabecalhoPagina } from "@/components/dash/AdminShell";
import { NovoColaborador } from "@/components/dash/NovoColaborador";
import { ImportarColaboradores } from "@/components/dash/ImportarColaboradores";
import { Avatar, Cartao, Etiqueta, Progresso, StatusJornada } from "@/components/ui";
import { ArrowRight } from "@/components/icons";
import { formatarMinutos, type Status } from "@/lib/ponto";

export interface ColaboradorLinha {
  id: string;
  matricula: string;
  nome: string;
  cargo: string | null;
  cargaMin: number;
  trabalhadoMin: number;
  status: Status;
  equipe?: string | null;
  turno?: string | null;
  desligadoEm?: string | null;
}

export interface Opcao {
  id: string;
  nome: string;
}

export function ColaboradoresView({
  funcionarios,
  aba = "ativos",
  busca = "",
  totais,
  equipes = [],
  turnos = [],
  equipeFiltro = "",
}: {
  funcionarios: ColaboradorLinha[];
  aba?: "ativos" | "desligados";
  busca?: string;
  totais?: { ativos: number; desligados: number };
  equipes?: Opcao[];
  turnos?: Opcao[];
  equipeFiltro?: string;
}) {
  const emTurno = funcionarios.filter((f) => f.status === "working").length;
  const n = funcionarios.length;
  const ativos = aba === "ativos";
  const qs = (a: string) => {
    const p = new URLSearchParams();
    if (a === "desligados") p.set("aba", "desligados");
    if (busca) p.set("q", busca);
    if (equipeFiltro) p.set("equipe", equipeFiltro);
    const s = p.toString();
    return `/admin/colaboradores${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <CabecalhoPagina
        titulo="Colaboradores"
        descricao={
          ativos
            ? n === 0 && !busca
              ? "Nenhum colaborador cadastrado ainda."
              : `${n} ${n === 1 ? "pessoa" : "pessoas"} · ${emTurno} em turno agora`
            : `${n} ${n === 1 ? "pessoa desligada" : "pessoas desligadas"}`
        }
      />

      {ativos && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <NovoColaborador equipes={equipes} turnos={turnos} />
          <ImportarColaboradores />
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 border-b border-line sm:flex-row sm:items-end sm:justify-between">
        <nav aria-label="Situação" className="flex gap-1">
          {(["ativos", "desligados"] as const).map((a) => (
            <Link
              key={a}
              href={qs(a)}
              aria-current={a === aba ? "page" : undefined}
              className={`relative px-3 py-2.5 text-sm font-medium ${a === aba ? "text-brand" : "text-ink-2 hover:text-ink"}`}
            >
              {a === "ativos" ? "Ativos" : "Desligados"}
              {totais && <span className="ml-1.5 text-ink-3">{a === "ativos" ? totais.ativos : totais.desligados}</span>}
              {a === aba && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand" />}
            </Link>
          ))}
        </nav>
        <form className="mb-2 flex flex-wrap gap-2" action="/admin/colaboradores">
          {!ativos && <input type="hidden" name="aba" value="desligados" />}
          {equipes.length > 0 && (
            <select name="equipe" defaultValue={equipeFiltro} className="campo w-auto" aria-label="Filtrar por equipe">
              <option value="">Todas as equipes</option>
              {equipes.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          )}
          <input
            type="search"
            name="q"
            defaultValue={busca}
            placeholder="Buscar nome, matrícula ou CPF"
            className="campo w-full sm:w-64"
          />
          <button type="submit" className="rounded-lg border border-line-strong bg-surface px-4 text-sm font-medium text-ink hover:border-ink-3">
            Buscar
          </button>
        </form>
      </div>

      {n === 0 ? (
        <Cartao className="px-5 py-10 text-center text-sm text-ink-3">
          {busca || equipeFiltro ? "Ninguém encontrado com esse filtro." : ativos ? "Cadastre o primeiro colaborador acima." : "Ninguém foi desligado."}
        </Cartao>
      ) : (
        <Cartao as="div" className="overflow-hidden">
          <div className="hidden grid-cols-[minmax(0,1fr)_9rem_10rem_13rem_1.5rem] gap-4 border-b border-line bg-paper px-5 py-2.5 text-xs font-medium text-ink-3 lg:grid">
            <span>Colaborador</span>
            <span>Equipe</span>
            <span>{ativos ? "Situação" : "Desligado em"}</span>
            <span>{ativos ? "Horas hoje" : "Turno"}</span>
            <span />
          </div>
          <ul className="divide-y divide-line">
            {funcionarios.map((f) => (
              <li key={f.id}>
                <Link
                  href={`/admin/funcionario/${f.id}`}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-3.5 transition-colors hover:bg-paper sm:px-5 lg:grid-cols-[minmax(0,1fr)_9rem_10rem_13rem_1.5rem]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Avatar nome={f.nome} />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink">{f.nome}</span>
                      <span className="block truncate text-sm text-ink-3">
                        <span className="num">{f.matricula}</span>
                        {f.cargo ? ` · ${f.cargo}` : ""}
                      </span>
                    </span>
                  </span>

                  <ArrowRight className="h-5 w-5 text-ink-3 lg:order-last" />

                  <span className="truncate text-sm text-ink-2 lg:order-none">
                    {f.equipe ?? <span className="text-ink-3">Sem equipe</span>}
                  </span>

                  {ativos ? (
                    <>
                      <span>
                        <StatusJornada status={f.status} />
                      </span>
                      <span className="col-span-2 lg:col-span-1">
                        <span className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
                          <span className="num font-medium text-ink">{formatarMinutos(f.trabalhadoMin)}</span>
                          <span className="text-ink-3">
                            de <span className="num">{formatarMinutos(f.cargaMin)}</span>
                          </span>
                        </span>
                        <Progresso valor={f.trabalhadoMin} total={f.cargaMin} rotulo={`Horas de hoje de ${f.nome}`} />
                      </span>
                    </>
                  ) : (
                    <>
                      <span>
                        <Etiqueta>
                          {f.desligadoEm ? f.desligadoEm.split("-").reverse().join("/") : "Desligado"}
                        </Etiqueta>
                      </span>
                      <span className="truncate text-sm text-ink-3">{f.turno ?? "—"}</span>
                    </>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </Cartao>
      )}
    </>
  );
}
