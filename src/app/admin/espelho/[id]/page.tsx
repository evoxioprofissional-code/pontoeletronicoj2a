import { redirect } from "next/navigation";
import { EspelhoView } from "@/components/views/EspelhoView";
import { contextoGestor, carregarBanco } from "@/lib/relatorios";
import { mesValido } from "@/lib/banco";
import { dataLocal } from "@/lib/ponto";

export default async function EspelhoAdmin({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { mes?: string };
}) {
  const ctx = await contextoGestor();
  if (!ctx) redirect("/app");

  const hoje = dataLocal(new Date());
  const mesAtual = hoje.slice(0, 7);
  const mes = mesValido(searchParams.mes) ?? mesAtual;

  // carregarBanco filtra pela empresa do gestor: id de outra empresa não volta.
  const [linha] = await carregarBanco(ctx.supabase, ctx.empresaId, mes, params.id);
  if (!linha) redirect("/admin/banco-horas");

  return (
    <EspelhoView
      empresa={ctx.empresa}
      pessoa={linha.pessoa}
      banco={linha.banco}
      mesAtual={mesAtual}
      hoje={hoje}
      base={`/admin/espelho/${linha.pessoa.id}`}
      voltar={{ href: `/admin/banco-horas?mes=${mes}`, rotulo: "Banco de horas" }}
      corrigirBase={`/admin/funcionario/${linha.pessoa.id}`}
    />
  );
}
