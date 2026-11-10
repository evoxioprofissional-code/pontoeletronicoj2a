import { redirect } from "next/navigation";
import { RelatoriosView } from "@/components/views/admin/RelatoriosView";
import { contextoGestor } from "@/lib/relatorios";
import { mesValido } from "@/lib/banco";
import { dataLocal } from "@/lib/ponto";

export default async function Relatorios({
  searchParams,
}: {
  searchParams: { mes?: string };
}) {
  const ctx = await contextoGestor();
  if (!ctx) redirect("/app");

  const mesAtual = dataLocal(new Date()).slice(0, 7);
  const mes = mesValido(searchParams.mes) ?? mesAtual;

  const { data: pessoas } = await ctx.supabase
    .from("funcionarios")
    .select("id, matricula, nome, ativo")
    .eq("empresa_id", ctx.empresaId)
    .order("nome");

  return (
    <RelatoriosView mes={mes} mesAtual={mesAtual} pessoas={pessoas ?? []} />
  );
}
