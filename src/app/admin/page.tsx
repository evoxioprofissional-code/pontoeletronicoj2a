import { createClient } from "@/lib/supabase/server";
import { BarCard, PieCard } from "@/components/dash/Charts";
import { computarMetricas, type FuncLite, type RegLite } from "@/lib/metrics";
import { formatarMinutos } from "@/lib/ponto";

const D = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(
    2,
    "0",
  )}/${d.getFullYear()}`;

function Stat({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="rounded-2xl border border-steel-line bg-steel px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-ink">
        {valor}
      </p>
    </div>
  );
}

export default async function DashboardAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: eu } = await supabase
    .from("funcionarios")
    .select("empresa_id, empresas(razao_social, nome_fantasia)")
    .eq("user_id", user!.id)
    .single();
  const empresaId = eu!.empresa_id;
  const empresa = Array.isArray(eu!.empresas) ? eu!.empresas[0] : eu!.empresas;

  const now = new Date();
  const inicio = new Date(now.getFullYear(), now.getMonth(), 1);
  const fim = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [{ data: funcs }, { data: regs }, { data: ajus }] = await Promise.all([
    supabase
      .from("funcionarios")
      .select("id, nome, cargo, carga_horaria_min, ativo")
      .eq("empresa_id", empresaId),
    supabase
      .from("registros_ponto")
      .select("funcionario_id, tipo, marcado_em")
      .eq("empresa_id", empresaId)
      .gte("marcado_em", inicio.toISOString())
      .lte("marcado_em", fim.toISOString()),
    supabase.from("ajustes_ponto").select("status").eq("empresa_id", empresaId),
  ]);

  const m = computarMetricas(
    (funcs ?? []) as FuncLite[],
    (regs ?? []) as RegLite[],
    (ajus ?? []) as { status: string }[],
  );

  return (
    <div className="px-5 py-6 lg:px-8">
      {/* Cabeçalho */}
      <header className="mb-5">
        <h1 className="text-xl font-semibold text-ink">Métricas e Gráficos</h1>
        <p className="text-sm text-muted">
          {empresa?.nome_fantasia ?? empresa?.razao_social} ·{" "}
          <span className="font-mono">
            {D(inicio)} — {D(fim)}
          </span>
        </p>
      </header>

      {/* Resumo */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <Stat label="Colaboradores" valor={String(m.totais.funcionarios)} />
        <Stat label="Ativos" valor={String(m.totais.ativos)} />
        <Stat
          label="Horas extras"
          valor={formatarMinutos(m.totais.horasExtrasMin)}
        />
        <Stat
          label="Horas faltantes"
          valor={formatarMinutos(m.totais.horasFaltantesMin)}
        />
        <Stat label="Marcações no mês" valor={String(m.totais.marcacoesMes)} />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <BarCard
          titulo="Top horas extras"
          data={m.topHorasExtras}
          cor="#6366F1"
          formato="tempo"
        />
        <BarCard
          titulo="Top horas faltantes"
          data={m.topHorasFaltantes}
          cor="#E5484D"
          formato="tempo"
        />
        <BarCard titulo="Solicitações" data={m.solicitacoes} cor="#F5A623" />
        <PieCard
          titulo="Colaboradores (ativos)"
          data={m.ativos}
          cores={["#3B82F6", "#3ECF8E"]}
        />
        <BarCard
          titulo="Top pontualidade (dias)"
          data={m.pontualidade}
          cor="#3ECF8E"
        />
        <BarCard
          titulo="Distribuição dos pontos"
          data={m.distribuicaoPontos}
          cor="#6366F1"
        />
        <PieCard
          titulo="Status dos dias"
          data={m.statusDias}
          cores={["#3ECF8E", "#F5A623"]}
        />
        <BarCard
          titulo="Top banco de horas positivo"
          data={m.bancoPositivo}
          cor="#3ECF8E"
          formato="tempo"
        />
        <BarCard
          titulo="Top banco de horas negativo"
          data={m.bancoNegativo}
          cor="#E5484D"
          formato="tempo"
        />
      </div>
    </div>
  );
}
