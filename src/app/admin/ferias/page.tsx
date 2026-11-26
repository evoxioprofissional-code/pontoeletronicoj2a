import Link from "next/link";
import { redirect } from "next/navigation";
import { CabecalhoPagina } from "@/components/dash/AdminShell";
import { AvisoMigracao } from "@/components/dash/AvisoMigracao";
import { FormFerias } from "@/components/dash/FormFerias";
import { BotaoConfirmar } from "@/components/dash/BotaoConfirmar";
import { Avatar, Aviso, Cartao, Etiqueta, Segmentado, TituloSecao } from "@/components/ui";
import { excluirFerias } from "./actions";
import { contextoGestor } from "@/lib/relatorios";
import { dataLocal } from "@/lib/ponto";
import { diasCorridos, situacaoFerias, type SituacaoFerias } from "@/lib/ferias";

const br = (d: string) => d.split("-").reverse().join("/");

const ESTADO: Record<SituacaoFerias["estado"], { rotulo: string; tom: "ok" | "aviso" | "erro" | "neutro" }> = {
  vencida: { rotulo: "Vencida", tom: "erro" },
  a_vencer: { rotulo: "A vencer", tom: "aviso" },
  em_dia: { rotulo: "Em dia", tom: "ok" },
  em_aquisicao: { rotulo: "Ainda sem direito", tom: "neutro" },
  sem_admissao: { rotulo: "Sem data de admissão", tom: "neutro" },
};
const ORDEM: SituacaoFerias["estado"][] = ["vencida", "a_vencer", "em_dia", "em_aquisicao", "sem_admissao"];

export default async function FeriasPage({ searchParams }: { searchParams: { aba?: string } }) {
  const ctx = await contextoGestor();
  if (!ctx) redirect("/app");
  const aba = searchParams.aba === "saldos" ? "saldos" : "lancadas";
  const hoje = dataLocal(new Date());

  const [p, f] = await Promise.all([
    ctx.supabase
      .from("funcionarios")
      .select("id, nome, data_admissao, ativo")
      .eq("empresa_id", ctx.empresaId)
      .eq("ativo", true)
      .order("nome"),
    ctx.supabase
      .from("ferias")
      .select("id, funcionario_id, inicio, fim, observacao")
      .eq("empresa_id", ctx.empresaId)
      .order("inicio", { ascending: false }),
  ]);
  if (p.error || f.error) {
    return (
      <>
        <CabecalhoPagina titulo="Férias" />
        <AvisoMigracao />
      </>
    );
  }

  const pessoas = p.data ?? [];
  const ferias = f.data ?? [];
  const nome = new Map(pessoas.map((x) => [x.id, x.nome as string]));
  const situacoes = pessoas
    .map((x) => ({
      ...x,
      s: situacaoFerias(
        x.data_admissao,
        ferias.filter((y) => y.funcionario_id === x.id),
        hoje,
      ),
    }))
    .sort((a, b) => ORDEM.indexOf(a.s.estado) - ORDEM.indexOf(b.s.estado) || (a.s.diasParaVencer ?? 9e9) - (b.s.diasParaVencer ?? 9e9));
  const alertas = situacoes.filter((x) => x.s.estado === "vencida" || x.s.estado === "a_vencer").length;
  const semAdmissao = situacoes.filter((x) => x.s.estado === "sem_admissao").length;

  const emCurso = ferias.filter((x) => x.inicio <= hoje && x.fim >= hoje);
  const proximas = ferias.filter((x) => x.inicio > hoje).sort((a, b) => a.inicio.localeCompare(b.inicio));
  const passadas = ferias.filter((x) => x.fim < hoje).slice(0, 30);

  const Linha = ({ x }: { x: (typeof ferias)[number] }) => (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 sm:px-5">
      <Avatar nome={nome.get(x.funcionario_id) ?? "?"} tamanho="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-ink">{nome.get(x.funcionario_id) ?? "Desligado"}</span>
        {x.observacao && <span className="block truncate text-sm text-ink-3">{x.observacao}</span>}
      </span>
      <span className="num text-sm text-ink">
        {br(x.inicio)} a {br(x.fim)}
      </span>
      <span className="num w-16 text-right text-sm text-ink-3">{diasCorridos(x)} dias</span>
      <form action={excluirFerias}>
        <input type="hidden" name="id" value={x.id} />
        <BotaoConfirmar
          pergunta="Excluir este período de férias?"
          className="text-sm font-medium text-danger hover:underline underline-offset-2"
        >
          Excluir
        </BotaoConfirmar>
      </form>
    </li>
  );

  const Grupo = ({ titulo, itens, vazio }: { titulo: string; itens: typeof ferias; vazio: string }) => (
    <section>
      <TituloSecao>{titulo}</TituloSecao>
      {itens.length === 0 ? (
        <Cartao as="div" className="px-5 py-6 text-sm text-ink-3">{vazio}</Cartao>
      ) : (
        <Cartao as="div">
          <ul className="divide-y divide-line">
            {itens.map((x) => <Linha key={x.id} x={x} />)}
          </ul>
        </Cartao>
      )}
    </section>
  );

  return (
    <>
      <CabecalhoPagina titulo="Férias" descricao="Lançamento de férias e controle de quem tem férias para vencer." />

      <Segmentado
        ativo={aba}
        itens={[
          { id: "lancadas", rotulo: "Lançamentos", href: "/admin/ferias" },
          { id: "saldos", rotulo: "Saldos e vencimentos", href: "/admin/ferias?aba=saldos", contador: alertas },
        ]}
      />

      {aba === "lancadas" ? (
        <div className="flex flex-col gap-7">
          <Cartao className="p-5 sm:p-6">
            <h2 className="mb-4 font-semibold text-ink">Lançar férias</h2>
            <FormFerias
              pessoas={situacoes.map((x) => ({
                id: x.id,
                nome: x.nome,
                saldo: x.s.estado === "sem_admissao" ? null : x.s.saldo,
              }))}
            />
            <p className="mt-3 text-sm text-ink-3">
              Nos dias de férias a pessoa não deve horas e o espelho mostra “Férias”.
            </p>
          </Cartao>
          <Grupo titulo="De férias agora" itens={emCurso} vazio="Ninguém de férias hoje." />
          <Grupo titulo="Próximas férias" itens={proximas} vazio="Nenhuma férias marcada." />
          <Grupo titulo="Já tiradas" itens={passadas} vazio="Nenhuma férias lançada ainda." />
        </div>
      ) : (
        <>
          {semAdmissao > 0 && (
            <Aviso tom="info" className="mb-4">
              {semAdmissao} {semAdmissao === 1 ? "pessoa está" : "pessoas estão"} sem data de
              admissão, então não dá para calcular as férias. Preencha em Colaboradores → abrir a
              pessoa → Dados do cadastro.
            </Aviso>
          )}
          <Cartao as="div" className="overflow-hidden">
            <div className="hidden grid-cols-[minmax(0,1fr)_7rem_6rem_6rem_9rem_8rem] gap-4 border-b border-line px-5 py-3 text-[0.75rem] font-semibold uppercase tracking-[0.04em] text-ink-3 lg:grid">
              <span>Colaborador</span><span>Admissão</span><span className="text-right">Direito</span>
              <span className="text-right">Saldo</span><span>Tirar até</span><span>Situação</span>
            </div>
            <ul className="divide-y divide-line">
              {situacoes.map(({ id, nome: n, data_admissao, s }) => (
                <li key={id} className="grid grid-cols-2 items-center gap-x-4 gap-y-1 px-4 py-3.5 sm:px-5 lg:grid-cols-[minmax(0,1fr)_7rem_6rem_6rem_9rem_8rem]">
                  <Link href={`/admin/funcionario/${id}`} className="col-span-2 flex min-w-0 items-center gap-3 lg:col-span-1">
                    <Avatar nome={n} tamanho="sm" />
                    <span className="truncate font-medium text-ink hover:underline">{n}</span>
                  </Link>
                  <span className="num text-sm text-ink-2">{data_admissao ? br(data_admissao) : "—"}</span>
                  <span className="num text-sm text-ink-2 lg:text-right">{s.diasDireito} dias</span>
                  <span className="num text-sm font-semibold text-ink lg:text-right">{s.saldo} dias</span>
                  <span className="num text-sm text-ink-2">
                    {s.limite ? br(s.limite) : s.proximoDireito ? `direito em ${br(s.proximoDireito)}` : "—"}
                  </span>
                  <span>
                    <Etiqueta tom={ESTADO[s.estado].tom}>
                      {ESTADO[s.estado].rotulo}
                      {s.estado === "a_vencer" && s.diasParaVencer !== null ? ` · ${s.diasParaVencer} dias` : ""}
                    </Etiqueta>
                  </span>
                </li>
              ))}
            </ul>
          </Cartao>
          <p className="mt-3 text-sm text-ink-3">
            Regra geral da CLT: a cada 12 meses a pessoa ganha 30 dias, que devem ser tirados nos 12
            meses seguintes. “A vencer” = faltam até 90 dias para o prazo. Faltas que reduzem os 30
            dias não entram neste cálculo.
          </p>
        </>
      )}
    </>
  );
}
