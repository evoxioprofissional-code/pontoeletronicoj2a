import Link from "next/link";
import { CabecalhoPagina } from "@/components/dash/AdminShell";
import { SeletorMes } from "@/components/SeletorMes";
import { Avatar, Aviso, Cartao, Etiqueta, botao } from "@/components/ui";
import { ArrowRight } from "@/components/icons";
import { formatarMinutos } from "@/lib/ponto";
import { formatarSaldo } from "@/lib/banco";
import type { LinhaBanco } from "@/lib/relatorios";

export function corSaldo(min: number): string {
  return min > 0 ? "text-ok" : min < 0 ? "text-danger" : "text-ink-3";
}

function Numero({
  rotulo,
  valor,
  cor = "text-ink",
  className = "",
}: {
  rotulo: string;
  valor: string;
  cor?: string;
  className?: string;
}) {
  return (
    <div className={`bg-surface px-5 py-4 ${className}`}>
      <p className="text-sm text-ink-3">{rotulo}</p>
      <p className={`num mt-1 text-2xl font-medium ${cor}`}>{valor}</p>
    </div>
  );
}

const COLUNAS =
  "md:grid-cols-[minmax(0,1fr)_6.5rem_6.5rem_7rem_7rem_1.25rem]";

export function BancoHorasView({
  mes,
  mesAtual,
  linhas,
}: {
  mes: string;
  mesAtual: string;
  linhas: LinhaBanco[];
}) {
  const saldoMes = linhas.reduce((a, l) => a + l.banco.saldoMin, 0);
  const acumulado = linhas.reduce((a, l) => a + l.banco.acumuladoMin, 0);
  const incompletos = linhas.reduce((a, l) => a + l.banco.incompletos, 0);

  return (
    <>
      <CabecalhoPagina
        titulo="Banco de horas"
        descricao="Saldo de cada pessoa: o que trabalhou menos o que devia trabalhar."
        acao={
          <div className="flex flex-wrap items-center gap-3">
            <SeletorMes mes={mes} mesAtual={mesAtual} base="/admin/banco-horas" />
            <a
              href={`/admin/relatorios/exportar?tipo=resumo&mes=${mes}`}
              className={botao("secundario")}
            >
              Baixar planilha
            </a>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-3">
        <Numero
          rotulo="Saldo da equipe no mês"
          valor={formatarSaldo(saldoMes)}
          cor={corSaldo(saldoMes)}
        />
        <Numero
          rotulo="Saldo acumulado da equipe"
          valor={formatarSaldo(acumulado)}
          cor={corSaldo(acumulado)}
        />
        <Numero
          rotulo="Dias sem saída registrada"
          valor={String(incompletos)}
          cor={incompletos > 0 ? "text-warn" : "text-ink"}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      {incompletos > 0 && (
        <Aviso tom="aviso" className="mt-4">
          Há {incompletos} {incompletos === 1 ? "dia" : "dias"} em que faltou
          registrar a saída. Nesses dias só contam os períodos fechados, então o
          saldo fica menor do que deveria. Abra a pessoa para ver quais são e
          corrigir.
        </Aviso>
      )}

      {linhas.length === 0 ? (
        <Cartao className="mt-5 px-5 py-12 text-center">
          <p className="font-medium text-ink">Nenhum colaborador cadastrado</p>
        </Cartao>
      ) : (
        <Cartao as="div" className="mt-5 overflow-hidden">
          <div
            className={`hidden gap-4 border-b border-line bg-paper px-5 py-2.5 text-xs font-medium text-ink-3 md:grid ${COLUNAS}`}
          >
            <span>Colaborador</span>
            <span className="text-right">Trabalhado</span>
            <span className="text-right">Previsto</span>
            <span className="text-right">Saldo do mês</span>
            <span className="text-right">Acumulado</span>
            <span />
          </div>
          <ul className="divide-y divide-line">
            {linhas.map(({ pessoa, banco }) => (
              <li key={pessoa.id}>
                <Link
                  href={`/admin/espelho/${pessoa.id}?mes=${mes}`}
                  className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 px-4 py-3.5 transition-colors hover:bg-paper sm:px-5 ${COLUNAS}`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Avatar nome={pessoa.nome} />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink">
                        {pessoa.nome}
                      </span>
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-3">
                        <span className="num">{pessoa.matricula}</span>
                        {!pessoa.ativo && <Etiqueta>Inativo</Etiqueta>}
                        {banco.incompletos > 0 && (
                          <Etiqueta tom="aviso">
                            {banco.incompletos} sem saída
                          </Etiqueta>
                        )}
                      </span>
                    </span>
                  </span>

                  <ArrowRight className="h-5 w-5 text-ink-3 md:order-last" />

                  {/* Celular: dois números lado a lado. Telas largas: quatro colunas. */}
                  <span className="hidden text-right md:block">
                    <span className="num text-[0.9375rem] text-ink">
                      {formatarMinutos(banco.trabalhadoMin)}
                    </span>
                  </span>
                  <span className="hidden text-right md:block">
                    <span className="num text-[0.9375rem] text-ink-3">
                      {formatarMinutos(banco.previstoMin)}
                    </span>
                  </span>
                  <span className="md:text-right">
                    <span className="block text-xs text-ink-3 md:hidden">
                      Saldo do mês
                    </span>
                    <span
                      className={`num text-[0.9375rem] font-medium ${corSaldo(banco.saldoMin)}`}
                    >
                      {formatarSaldo(banco.saldoMin)}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block text-xs text-ink-3 md:hidden">
                      Acumulado
                    </span>
                    <span
                      className={`num text-[0.9375rem] font-medium ${corSaldo(banco.acumuladoMin)}`}
                    >
                      {formatarSaldo(banco.acumuladoMin)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Cartao>
      )}

      <section className="mt-6 max-w-3xl text-sm leading-relaxed text-ink-2">
        <h2 className="mb-2 text-[0.9375rem] font-semibold text-ink">
          Como o saldo é calculado
        </h2>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            De segunda a sexta, a pessoa deve cumprir a jornada diária dela. O
            que passar vira saldo positivo; o que faltar, negativo.
          </li>
          <li>
            Sábado e domingo não têm jornada prevista: tudo que for trabalhado
            entra como saldo positivo.
          </li>
          <li>
            Dia útil sem nenhum registro <strong>não desconta</strong>. Ele
            aparece como “sem registro” no espelho, para você decidir se foi
            falta, feriado, férias ou atestado.
          </li>
          <li>O dia de hoje só entra no saldo depois da saída registrada.</li>
          <li>
            O acumulado soma todos os meses desde o primeiro registro da pessoa,
            usando a jornada diária atual dela.
          </li>
        </ul>
      </section>
    </>
  );
}
