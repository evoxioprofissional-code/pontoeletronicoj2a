import Link from "next/link";
import { redirect } from "next/navigation";
import { CabecalhoPagina } from "@/components/dash/AdminShell";
import {
  ListaSolicitacoes,
  type LinhaSolicitacao,
} from "@/components/dash/ListaSolicitacoes";
import { AvisoMigracao } from "@/components/dash/AvisoMigracao";
import { Cartao, Segmentado } from "@/components/ui";
import { contextoGestor } from "@/lib/relatorios";
import { horaLocal } from "@/lib/ponto";
import { COLUNAS_SOLICITACAO, type Solicitacao } from "@/lib/solicitacoes";

const ABAS = [
  { id: "pendente", rotulo: "Pendentes" },
  { id: "respondidas", rotulo: "Respondidas" },
] as const;

export default async function SolicitacoesRH({
  searchParams,
}: {
  searchParams: { aba?: string };
}) {
  const ctx = await contextoGestor();
  if (!ctx) redirect("/app");
  const aba = searchParams.aba === "respondidas" ? "respondidas" : "pendente";

  let q = ctx.supabase
    .from("ajustes_ponto")
    .select(COLUNAS_SOLICITACAO)
    .eq("empresa_id", ctx.empresaId);
  q =
    aba === "pendente"
      ? q.eq("status", "pendente").order("created_at", { ascending: true })
      : q.neq("status", "pendente").order("respondido_em", { ascending: false });
  const [{ data, error }, { data: pessoas }, { count }] = await Promise.all([
    q.limit(200),
    ctx.supabase
      .from("funcionarios")
      .select("id, nome, equipe:equipes(nome)")
      .eq("empresa_id", ctx.empresaId),
    ctx.supabase
      .from("ajustes_ponto")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", ctx.empresaId)
      .eq("status", "pendente"),
  ]);

  if (error) {
    return (
      <>
        <CabecalhoPagina titulo="Solicitações" />
        <AvisoMigracao />
      </>
    );
  }

  const nomes = new Map(
    (pessoas ?? []).map((p) => {
      const eq = Array.isArray(p.equipe) ? p.equipe[0] : p.equipe;
      return [p.id, { nome: p.nome as string, equipe: (eq as { nome?: string } | null)?.nome ?? null }];
    }),
  );

  const lista = (data ?? []) as Solicitacao[];
  // Horário atual das marcações que alguém pediu para corrigir.
  const regIds = lista.filter((s) => s.registro_id).map((s) => s.registro_id!) ;
  const horas = new Map<string, string>();
  if (regIds.length) {
    const { data: regs } = await ctx.supabase
      .from("registros_ponto")
      .select("id, marcado_em")
      .in("id", regIds);
    for (const r of regs ?? []) horas.set(r.id, horaLocal(r.marcado_em));
  }

  const linhas: LinhaSolicitacao[] = lista.map((s) => ({
    ...s,
    nome: nomes.get(s.funcionario_id)?.nome ?? "—",
    equipe: nomes.get(s.funcionario_id)?.equipe ?? null,
    horaAtual: s.registro_id ? (horas.get(s.registro_id) ?? null) : null,
  }));

  return (
    <>
      <CabecalhoPagina
        titulo="Solicitações"
        descricao="Pedidos de ajuste de ponto e abono feitos pelos colaboradores."
      />

      <Segmentado
        ativo={aba}
        itens={[
          { id: "pendente", rotulo: "Pendentes", href: "/admin/solicitacoes", contador: count ?? 0 },
          { id: "respondidas", rotulo: "Respondidas", href: "/admin/solicitacoes?aba=respondidas" },
        ]}
      />

      {linhas.length === 0 ? (
        <Cartao className="px-5 py-12 text-center">
          <p className="font-medium text-ink">
            {aba === "pendente" ? "Nenhum pedido aguardando" : "Nenhum pedido respondido ainda"}
          </p>
          <p className="mt-1 text-sm text-ink-3">
            Os colaboradores pedem ajuste pelo app, em Registros → Pedir ajuste.
          </p>
        </Cartao>
      ) : (
        <ListaSolicitacoes linhas={linhas} pendentes={aba === "pendente"} />
      )}
    </>
  );
}
