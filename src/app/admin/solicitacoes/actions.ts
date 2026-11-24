"use server";

import { revalidatePath } from "next/cache";
import { contextoGestor } from "@/lib/relatorios";
import { usuarioAtual } from "@/lib/supabase/server";
import { COLUNAS_SOLICITACAO, type Solicitacao } from "@/lib/solicitacoes";

type Ctx = NonNullable<Awaited<ReturnType<typeof contextoGestor>>>;

async function meuId(ctx: Ctx): Promise<string | null> {
  const user = await usuarioAtual(ctx.supabase);
  if (!user) return null;
  const { data } = await ctx.supabase
    .from("funcionarios")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  return data?.id ?? null;
}

/**
 * Aplica um pedido aprovado nas marcações. Devolve uma mensagem de erro ou null.
 * - incluir: cria a marcação (como "incluída pelo RH");
 * - alterar: corrige o horário, guardando o original;
 * - abonar: nada a gravar aqui — o banco de horas lê os abonos aprovados.
 */
async function aplicar(ctx: Ctx, s: Solicitacao, gestorId: string): Promise<string | null> {
  const agora = new Date().toISOString();
  if (s.categoria === "incluir") {
    if (!s.tipo || !s.marcado_em) return "Pedido sem horário.";
    const { error } = await ctx.supabase.from("registros_ponto").insert({
      empresa_id: ctx.empresaId,
      funcionario_id: s.funcionario_id,
      tipo: s.tipo,
      marcado_em: s.marcado_em,
      metodo_verificacao: "manual",
      dentro_cerca: false,
      ajustado: true,
      ajuste_motivo: `Pedido aprovado: ${s.justificativa}`.slice(0, 500),
      ajustado_por: gestorId,
      ajustado_em: agora,
    });
    return error ? error.message : null;
  }
  if (s.categoria === "alterar") {
    if (!s.registro_id || !s.marcado_em) return "Pedido sem marcação.";
    const { data: reg } = await ctx.supabase
      .from("registros_ponto")
      .select("id, empresa_id, funcionario_id, marcado_em, marcado_em_original")
      .eq("id", s.registro_id)
      .maybeSingle();
    if (!reg || reg.empresa_id !== ctx.empresaId || reg.funcionario_id !== s.funcionario_id) {
      return "A marcação deste pedido não existe mais.";
    }
    const { error } = await ctx.supabase
      .from("registros_ponto")
      .update({
        marcado_em: s.marcado_em,
        marcado_em_original: reg.marcado_em_original ?? reg.marcado_em,
        ajustado: true,
        ajuste_motivo: `Pedido aprovado: ${s.justificativa}`.slice(0, 500),
        ajustado_por: gestorId,
        ajustado_em: agora,
      })
      .eq("id", reg.id);
    return error ? error.message : null;
  }
  return null;
}

export type RespostaState = { ok?: string; error?: string };

/** Aprova ou recusa um ou vários pedidos. */
export async function responderSolicitacoes(
  _prev: RespostaState,
  form: FormData,
): Promise<RespostaState> {
  const ctx = await contextoGestor();
  if (!ctx) return { error: "Sem permissão." };
  const gestorId = await meuId(ctx);
  if (!gestorId) return { error: "Sessão expirada." };

  const decisao = String(form.get("decisao") ?? "");
  if (decisao !== "aprovar" && decisao !== "recusar") return { error: "Ação inválida." };
  const resposta = String(form.get("resposta") ?? "").trim().slice(0, 500);
  const ids = form.getAll("id").map(String).filter(Boolean).slice(0, 200);
  if (ids.length === 0) return { error: "Selecione pelo menos um pedido." };
  if (decisao === "recusar" && !resposta) {
    return { error: "Ao recusar, escreva o motivo para a pessoa." };
  }

  const { data } = await ctx.supabase
    .from("ajustes_ponto")
    .select(COLUNAS_SOLICITACAO)
    .eq("empresa_id", ctx.empresaId)
    .eq("status", "pendente")
    .in("id", ids);
  const pedidos = (data ?? []) as Solicitacao[];
  if (pedidos.length === 0) return { error: "Esses pedidos já foram respondidos." };

  let feitos = 0;
  const falhas: string[] = [];
  for (const s of pedidos) {
    if (decisao === "aprovar") {
      const erro = await aplicar(ctx, s, gestorId);
      if (erro) {
        falhas.push(erro);
        continue;
      }
    }
    // Só marca como respondido se ainda estiver pendente (evita aplicar duas vezes).
    const { error } = await ctx.supabase
      .from("ajustes_ponto")
      .update({
        status: decisao === "aprovar" ? "aprovado" : "rejeitado",
        aprovado_por: gestorId,
        resposta: resposta || null,
        respondido_em: new Date().toISOString(),
      })
      .eq("id", s.id)
      .eq("status", "pendente");
    if (error) falhas.push(error.message);
    else feitos++;
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/app/solicitacoes");
  const verbo = decisao === "aprovar" ? "aprovado" : "recusado";
  if (falhas.length > 0) {
    return {
      error: `${feitos} ${verbo}(s). ${falhas.length} não puderam ser processados: ${falhas[0]}`,
    };
  }
  return { ok: `${feitos} ${feitos === 1 ? `pedido ${verbo}` : `pedidos ${verbo}s`}.` };
}

/** Link temporário (5 min) para o RH abrir o anexo de um pedido. */
export async function linkAnexo(id: string): Promise<{ url?: string; error?: string }> {
  const ctx = await contextoGestor();
  if (!ctx) return { error: "Sem permissão." };
  const { data } = await ctx.supabase
    .from("ajustes_ponto")
    .select("anexo_path, empresa_id")
    .eq("id", id)
    .maybeSingle();
  if (!data?.anexo_path || data.empresa_id !== ctx.empresaId) {
    return { error: "Anexo não encontrado." };
  }
  const { data: link, error } = await ctx.supabase.storage
    .from("anexos")
    .createSignedUrl(data.anexo_path, 300);
  if (error || !link) return { error: "Não foi possível abrir o anexo." };
  return { url: link.signedUrl };
}
