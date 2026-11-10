import { CabecalhoPagina } from "@/components/dash/AdminShell";
import { RankCard, SplitCard } from "@/components/dash/Charts";
import { formatarMinutos } from "@/lib/ponto";
import type { Metricas } from "@/lib/metrics";

export interface DashboardViewProps {
  empresa: string | null;
  /** Ex.: "01/11/2026 a 30/11/2026" */
  periodo: string;
  m: Metricas;
}

function Numero({
  rotulo,
  valor,
  className = "",
}: {
  rotulo: string;
  valor: string;
  className?: string;
}) {
  return (
    <div className={`bg-surface px-5 py-4 ${className}`}>
      <p className="text-sm text-ink-3">{rotulo}</p>
      <p className="num mt-1 text-2xl font-medium text-ink">{valor}</p>
    </div>
  );
}

function Grupo({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-[0.9375rem] font-semibold text-ink">{titulo}</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  );
}

export function DashboardView({ empresa, periodo, m }: DashboardViewProps) {
  return (
    <>
      <CabecalhoPagina
        titulo="Visão geral"
        descricao={
          <>
            {empresa ? `${empresa} · ` : ""}
            <span className="num">{periodo}</span>
          </>
        }
      />

      {/* Números do mês: uma faixa só, dividida por linhas */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-5">
        <Numero rotulo="Colaboradores" valor={String(m.totais.funcionarios)} />
        <Numero rotulo="Ativos" valor={String(m.totais.ativos)} />
        <Numero
          rotulo="Horas extras"
          valor={formatarMinutos(m.totais.horasExtrasMin)}
        />
        <Numero
          rotulo="Horas faltantes"
          valor={formatarMinutos(m.totais.horasFaltantesMin)}
        />
        <Numero
          rotulo="Marcações no mês"
          valor={String(m.totais.marcacoesMes)}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      <Grupo titulo="Horas">
        <RankCard
          titulo="Mais horas extras"
          descricao="Soma do que passou da jornada."
          data={m.topHorasExtras}
          formato="tempo"
          vazio="Ninguém fez hora extra neste mês."
        />
        <RankCard
          titulo="Mais horas faltantes"
          descricao="Soma do que faltou para a jornada."
          data={m.topHorasFaltantes}
          formato="tempo"
          tom="danger"
          vazio="Ninguém ficou devendo horas neste mês."
        />
        <RankCard
          titulo="Banco de horas positivo"
          data={m.bancoPositivo}
          formato="tempo"
          tom="ok"
          vazio="Nenhum saldo positivo neste mês."
        />
        <RankCard
          titulo="Banco de horas negativo"
          data={m.bancoNegativo}
          formato="tempo"
          tom="danger"
          vazio="Nenhum saldo negativo neste mês."
        />
      </Grupo>

      <Grupo titulo="Presença">
        <RankCard
          titulo="Dias com registro"
          descricao="Quantos dias cada pessoa bateu ponto."
          data={m.pontualidade}
          unidade="dias"
          vazio="Nenhuma marcação neste mês."
        />
        <SplitCard
          titulo="Dias completos e incompletos"
          descricao="Completo = terminou com a saída registrada."
          data={m.statusDias}
          cores={["#1B7A4B", "#D2A24C"]}
          vazio="Nenhuma marcação neste mês."
        />
        <SplitCard
          titulo="Marcações por tipo"
          data={m.distribuicaoPontos}
          vazio="Nenhuma marcação neste mês."
        />
      </Grupo>

      <Grupo titulo="Equipe">
        <SplitCard
          titulo="Colaboradores"
          data={m.ativos}
          cores={["#0E4F5E", "#B8B2A7"]}
          vazio="Nenhum colaborador cadastrado."
        />
        <SplitCard
          titulo="Pedidos de ajuste"
          data={m.solicitacoes}
          cores={["#D2A24C", "#1B7A4B", "#B4281E"]}
          vazio="Nenhum pedido de ajuste."
        />
      </Grupo>
    </>
  );
}
