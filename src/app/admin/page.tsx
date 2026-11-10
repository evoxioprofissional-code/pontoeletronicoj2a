import { createClient, usuarioAtual } from "@/lib/supabase/server";
import { DashboardView } from "@/components/views/admin/DashboardView";
import { computarMetricas, type FuncLite, type RegLite } from "@/lib/metrics";
import { limitesDoMes, FUSO } from "@/lib/ponto";

const D = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO }).format(new Date(iso));

export default async function DashboardAdmin() {
  const supabase = createClient();
  const user = await usuarioAtual(supabase);
  const { data: eu } = await supabase
    .from("funcionarios")
    .select("empresa_id, empresas(razao_social, nome_fantasia)")
    .eq("user_id", user!.id)
    .single();
  const empresaId = eu!.empresa_id;
  const empresa = (
    Array.isArray(eu!.empresas) ? eu!.empresas[0] : eu!.empresas
  ) as { razao_social: string | null; nome_fantasia: string | null } | null;

  const { inicio, fim } = limitesDoMes(new Date());

  const [{ data: funcs }, { data: regs }, { data: ajus }] = await Promise.all([
    supabase
      .from("funcionarios")
      .select("id, nome, cargo, carga_horaria_min, ativo")
      .eq("empresa_id", empresaId),
    supabase
      .from("registros_ponto")
      .select("funcionario_id, tipo, marcado_em")
      .eq("empresa_id", empresaId)
      .gte("marcado_em", inicio)
      .lte("marcado_em", fim),
    supabase.from("ajustes_ponto").select("status").eq("empresa_id", empresaId),
  ]);

  const m = computarMetricas(
    (funcs ?? []) as FuncLite[],
    (regs ?? []) as RegLite[],
    (ajus ?? []) as { status: string }[],
  );

  return (
    <DashboardView
      empresa={empresa?.nome_fantasia ?? empresa?.razao_social ?? null}
      periodo={`${D(inicio)} a ${D(fim)}`}
      m={m}
    />
  );
}
