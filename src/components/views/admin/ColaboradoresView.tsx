import Link from "next/link";
import { CabecalhoPagina } from "@/components/dash/AdminShell";
import { NovoColaborador } from "@/components/dash/NovoColaborador";
import { Avatar, Cartao, Progresso, StatusJornada } from "@/components/ui";
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
}

export function ColaboradoresView({
  funcionarios,
}: {
  funcionarios: ColaboradorLinha[];
}) {
  const emTurno = funcionarios.filter((f) => f.status === "working").length;
  const n = funcionarios.length;

  return (
    <>
      <CabecalhoPagina
        titulo="Colaboradores"
        descricao={
          n === 0
            ? "Nenhum colaborador cadastrado ainda."
            : `${n} ${n === 1 ? "pessoa" : "pessoas"} · ${emTurno} em turno agora`
        }
      />

      <NovoColaborador />

      {n > 0 && (
        <Cartao as="div" className="overflow-hidden">
          {/* Cabeçalho da tabela — só em telas largas */}
          <div className="hidden grid-cols-[minmax(0,1fr)_10rem_13rem_1.5rem] gap-4 border-b border-line bg-paper px-5 py-2.5 text-xs font-medium text-ink-3 md:grid">
            <span>Colaborador</span>
            <span>Situação</span>
            <span>Horas hoje</span>
            <span />
          </div>
          <ul className="divide-y divide-line">
            {funcionarios.map((f) => (
              <li key={f.id}>
                <Link
                  href={`/admin/funcionario/${f.id}`}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-3.5 transition-colors hover:bg-paper sm:px-5 md:grid-cols-[minmax(0,1fr)_10rem_13rem_1.5rem]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Avatar nome={f.nome} />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink">
                        {f.nome}
                      </span>
                      <span className="block truncate text-sm text-ink-3">
                        <span className="num">{f.matricula}</span>
                        {f.cargo ? ` · ${f.cargo}` : ""}
                      </span>
                    </span>
                  </span>

                  <ArrowRight className="h-5 w-5 text-ink-3 md:order-last" />

                  <span className="md:order-none">
                    <StatusJornada status={f.status} />
                  </span>

                  <span className="col-span-2 md:col-span-1">
                    <span className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
                      <span className="num font-medium text-ink">
                        {formatarMinutos(f.trabalhadoMin)}
                      </span>
                      <span className="text-ink-3">
                        de{" "}
                        <span className="num">
                          {formatarMinutos(f.cargaMin)}
                        </span>
                      </span>
                    </span>
                    <Progresso
                      valor={f.trabalhadoMin}
                      total={f.cargaMin}
                      rotulo={`Horas de hoje de ${f.nome}`}
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Cartao>
      )}
    </>
  );
}
