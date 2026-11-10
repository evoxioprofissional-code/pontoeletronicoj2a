import Link from "next/link";
import { SeletorMes } from "@/components/SeletorMes";
import { BotaoImprimir } from "@/components/BotaoImprimir";
import { ArrowLeft } from "@/components/icons";
import { formatarMinutos, horaLocal } from "@/lib/ponto";
import {
  formatarSaldo,
  rotuloMes,
  type DiaBanco,
  type MesBanco,
  type SituacaoDia,
} from "@/lib/banco";
import type { EmpresaInfo, MarcacaoBanco, PessoaBanco } from "@/lib/relatorios";

export interface EspelhoViewProps {
  empresa: EmpresaInfo;
  pessoa: PessoaBanco;
  banco: MesBanco<MarcacaoBanco>;
  mesAtual: string;
  /** Dia de hoje, "AAAA-MM-DD". */
  hoje: string;
  /** Caminho desta página (para trocar de mês). */
  base: string;
  voltar: { href: string; rotulo: string };
  /** RH: caminho da tela de ajuste da pessoa, para corrigir um dia. */
  corrigirBase?: string;
}

const SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

const SITUACAO: Record<SituacaoDia, { texto: string; cor: string }> = {
  completo: { texto: "", cor: "" },
  incompleto: { texto: "Faltou registrar a saída", cor: "text-warn" },
  andamento: { texto: "Em andamento", cor: "text-brand" },
  sem_registro: { texto: "Sem registro", cor: "text-ink-3" },
  folga: { texto: "", cor: "" },
  futuro: { texto: "", cor: "" },
  antes: { texto: "", cor: "" },
};

const cor = (min: number) =>
  min > 0 ? "text-ok" : min < 0 ? "text-danger" : "text-ink-3";

/** Quantos dias `dia` está antes de `hoje` (0 = hoje). */
function diasAtras(dia: string, hoje: string): number {
  const ms = +new Date(`${hoje}T12:00:00Z`) - +new Date(`${dia}T12:00:00Z`);
  return Math.round(ms / 86_400_000);
}

function Total({ rotulo, valor, corValor = "text-ink" }: {
  rotulo: string;
  valor: string;
  corValor?: string;
}) {
  return (
    <div className="bg-surface px-4 py-3 print:px-2 print:py-1.5">
      <dt className="text-xs text-ink-3">{rotulo}</dt>
      <dd className={`num mt-0.5 text-lg font-medium print:text-sm ${corValor}`}>
        {valor}
      </dd>
    </div>
  );
}

function Marcacoes({ dia }: { dia: DiaBanco<MarcacaoBanco> }) {
  if (dia.marcacoes.length === 0) {
    return <span className="text-ink-3">—</span>;
  }
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-0.5">
      {dia.marcacoes.map((m, i) => (
        <span key={i} className="num whitespace-nowrap text-ink">
          {horaLocal(m.marcado_em)}
          {m.metodo_verificacao === "manual" ? (
            <sup className="ml-px text-ink-3">†</sup>
          ) : m.ajustado ? (
            <sup className="ml-px text-ink-3">*</sup>
          ) : null}
        </span>
      ))}
    </span>
  );
}

/** Espelho de ponto do mês — usado pelo RH e pelo próprio funcionário. */
export function EspelhoView({
  empresa,
  pessoa,
  banco,
  mesAtual,
  hoje,
  base,
  voltar,
  corrigirBase,
}: EspelhoViewProps) {
  const temAjuste = banco.dias.some((d) =>
    d.marcacoes.some((m) => m.ajustado && m.metodo_verificacao !== "manual"),
  );
  const temManual = banco.dias.some((d) =>
    d.marcacoes.some((m) => m.metodo_verificacao === "manual"),
  );

  return (
    <article>
      <Link
        href={voltar.href}
        className="mb-4 inline-flex min-h-[2.75rem] items-center gap-1.5 text-sm font-medium text-ink-2 hover:text-ink print:hidden"
      >
        <ArrowLeft className="h-4 w-4" />
        {voltar.rotulo}
      </Link>

      <header className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <p className="text-sm text-ink-3">
            Espelho de ponto
            <span className="hidden print:inline"> · {rotuloMes(banco.mes)}</span>
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-ink print:text-xl">
            {pessoa.nome}
          </h1>
          <p className="mt-0.5 text-sm text-ink-2">
            Matrícula <span className="num">{pessoa.matricula}</span>
            {pessoa.cargo ? ` · ${pessoa.cargo}` : ""} · Jornada diária{" "}
            <span className="num">{formatarMinutos(pessoa.cargaMin)}</span>
          </p>
          {(empresa.nome || empresa.cnpj) && (
            <p className="mt-0.5 text-sm text-ink-3">
              {empresa.nome}
              {empresa.cnpj ? ` · CNPJ ${empresa.cnpj}` : ""}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SeletorMes mes={banco.mes} mesAtual={mesAtual} base={base} />
          <BotaoImprimir>Imprimir ou salvar PDF</BotaoImprimir>
        </div>
      </header>

      {/* Totais */}
      <dl className="mb-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-5 print:grid-cols-5 print:rounded-none">
        <Total rotulo="Trabalhado" valor={formatarMinutos(banco.trabalhadoMin)} />
        <Total rotulo="Previsto" valor={formatarMinutos(banco.previstoMin)} />
        <Total
          rotulo="Saldo do mês"
          valor={formatarSaldo(banco.saldoMin)}
          corValor={cor(banco.saldoMin)}
        />
        <Total
          rotulo="Saldo anterior"
          valor={formatarSaldo(banco.anteriorMin)}
          corValor={cor(banco.anteriorMin)}
        />
        <div className="col-span-2 sm:col-span-1 print:col-span-1">
          <Total
            rotulo="Saldo acumulado"
            valor={formatarSaldo(banco.acumuladoMin)}
            corValor={cor(banco.acumuladoMin)}
          />
        </div>
      </dl>

      {/* Dias */}
      <div className="overflow-hidden rounded-xl border border-line bg-surface print:rounded-none">
        <table className="w-full border-collapse text-sm print:text-xs">
          <thead>
            <tr className="border-b border-line bg-paper text-left text-xs font-medium text-ink-3">
              <th scope="col" className="w-[4.25rem] px-3 py-2.5 font-medium sm:px-4 print:py-1">
                Dia
              </th>
              <th scope="col" className="px-2 py-2.5 font-medium print:py-1">
                Marcações
              </th>
              <th scope="col" className="hidden px-2 py-2.5 text-right font-medium sm:table-cell print:table-cell print:py-1">
                Trabalhado
              </th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium sm:px-4 print:py-1">
                Saldo
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {banco.dias.map((d) => {
              const s = SITUACAO[d.situacao];
              const apagado =
                d.situacao === "folga" ||
                d.situacao === "futuro" ||
                d.situacao === "antes";
              const podeCorrigir =
                corrigirBase && d.dia <= hoje && d.situacao !== "antes";
              return (
                <tr
                  key={d.dia}
                  className={`${!d.util ? "bg-paper/60" : ""} ${apagado ? "text-ink-3" : ""} print:break-inside-avoid`}
                >
                  <th
                    scope="row"
                    className="whitespace-nowrap px-3 py-2.5 text-left align-top font-normal sm:px-4 print:py-1"
                  >
                    <span className="num font-medium text-ink">
                      {d.dia.slice(8)}
                    </span>{" "}
                    <span className="text-ink-3">{SEMANA[d.semana]}</span>
                  </th>
                  <td className="px-2 py-2.5 align-top print:py-1">
                    <Marcacoes dia={d} />
                    {(s.texto || podeCorrigir) && (
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs">
                        {s.texto && <span className={s.cor}>{s.texto}</span>}
                        {podeCorrigir &&
                          (d.situacao === "incompleto" ||
                            d.situacao === "sem_registro") && (
                            <Link
                              href={`${corrigirBase}?d=${-diasAtras(d.dia, hoje)}`}
                              className="font-medium text-brand underline underline-offset-2 print:hidden"
                            >
                              Corrigir
                            </Link>
                          )}
                      </span>
                    )}
                  </td>
                  <td className="num hidden whitespace-nowrap px-2 py-2.5 text-right align-top sm:table-cell print:table-cell print:py-1">
                    {d.marcacoes.length > 0 ? formatarMinutos(d.trabalhadoMin) : ""}
                  </td>
                  <td
                    className={`num whitespace-nowrap px-3 py-2.5 text-right align-top font-medium sm:px-4 print:py-1 ${
                      d.conta ? cor(d.saldoMin) : "text-ink-3"
                    }`}
                  >
                    {d.conta ? formatarSaldo(d.saldoMin) : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <footer className="mt-4 text-xs leading-relaxed text-ink-3">
        {(temAjuste || temManual) && (
          <p>
            {temAjuste && "* horário ajustado pelo RH. "}
            {temManual && "† marcação incluída pelo RH."}
          </p>
        )}
        <p>
          Dias úteis: segunda a sexta. Dia útil sem registro não entra no saldo.
          Dia sem saída registrada conta apenas os períodos fechados.
        </p>

        {/* Assinaturas — só na impressão */}
        <div className="mt-12 hidden grid-cols-2 gap-12 text-center text-ink print:grid">
          <p className="border-t border-ink pt-1.5">Assinatura do funcionário</p>
          <p className="border-t border-ink pt-1.5">Assinatura do empregador</p>
        </div>
      </footer>
    </article>
  );
}
