import { redirect } from "next/navigation";
import { BancoHorasView } from "@/components/views/admin/BancoHorasView";
import { contextoGestor, carregarBanco } from "@/lib/relatorios";
import { mesValido } from "@/lib/banco";
import { dataLocal } from "@/lib/ponto";

export default async function BancoHoras({
  searchParams,
}: {
  searchParams: { mes?: string };
}) {
  const ctx = await contextoGestor();
  if (!ctx) redirect("/app");

  const mesAtual = dataLocal(new Date()).slice(0, 7);
  const mes = mesValido(searchParams.mes) ?? mesAtual;
  const linhas = await carregarBanco(ctx.supabase, ctx.empresaId, mes);

  return <BancoHorasView mes={mes} mesAtual={mesAtual} linhas={linhas} />;
}
