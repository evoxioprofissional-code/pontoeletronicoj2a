import { redirect } from "next/navigation";
import { DashboardView } from "@/components/views/admin/DashboardView";
import { contextoGestor, carregarBase } from "@/lib/relatorios";
import { montarPainel } from "@/lib/painel";
import { mesValido } from "@/lib/banco";
import { dataLocal } from "@/lib/ponto";

export default async function DashboardAdmin({
  searchParams,
}: {
  searchParams: { mes?: string };
}) {
  const ctx = await contextoGestor();
  if (!ctx) redirect("/app");

  const agora = new Date();
  const hoje = dataLocal(agora);
  const mesAtual = hoje.slice(0, 7);
  const mes = mesValido(searchParams.mes) ?? mesAtual;

  const { pessoas, registros } = await carregarBase(ctx.supabase, ctx.empresaId, mes);

  return (
    <DashboardView
      empresa={ctx.empresa.nome}
      mesAtual={mesAtual}
      hoje={hoje}
      d={montarPainel(pessoas, registros, mes, agora)}
    />
  );
}
