"use server";

import { revalidatePath } from "next/cache";
import { createClient, usuarioAtual } from "@/lib/supabase/server";
import { CICLO, dataLocal, horaLocal, limitesDoDia, type TipoDB } from "@/lib/ponto";
import type { Categoria } from "@/lib/solicitacoes";

export type EnvioState = { ok?: boolean; error?: string };

async function eu() {
  const supabase = createClient();
  const user = await usuarioAtual(supabase);
  if (!user) return null;
  const { data } = await supabase
    .from("funcionarios")
    .select("id, empresa_id")
    .eq("user_id", user.id)
    .maybeSingle();
  return data ? { supabase, ...data } : null;
}

const DIA_RE = /^\d{4}-\d{2}-\d{2}$/;
const HORA_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Marcações de um dia do próprio funcionário (para escolher qual corrigir). */
export async function minhasMarcacoesDoDia(
  dia: string,
): Promise<{ id: string; tipo: TipoDB; hora: string }[]> {
  if (!DIA_RE.test(dia)) return [];
  const ctx = await eu();
  if (!ctx) return [];
  const { inicio, fim } = limitesDoDia(new Date(`${dia}T12:00:00-03:00`));
  const { data } = await ctx.supabase
    .from("registros_ponto")
    .select("id, tipo, marcado_em")
    .eq("funcionario_id", ctx.id)
    .gte("marcado_em", inicio)
    .lte("marcado_em", fim)
    .order("marcado_em");
  return (data ?? []).map((r) => ({
    id: r.id,
    tipo: r.tipo as TipoDB,
    hora: horaLocal(r.marcado_em),
  }));
}

/** O funcionário envia uma solicitação de ajuste para o RH. */
export async function enviarSolicitacao(
  _prev: EnvioState,
  form: FormData,
): Promise<EnvioState> {
  const ctx = await eu();
  if (!ctx) return { error: "Sessão expirada. Entre novamente." };

  const categoria = String(form.get("categoria") ?? "") as Categoria;
  const dia = String(form.get("dia") ?? "");
  const hora = String(form.get("hora") ?? "");
  const tipo = String(form.get("tipo") ?? "") as TipoDB;
  const registroId = String(form.get("registro_id") ?? "");
  const justificativa = String(form.get("justificativa") ?? "").trim();
  const anexo = String(form.get("anexo_path") ?? "").trim();

  if (!["incluir", "alterar", "abonar"].includes(categoria)) {
    return { error: "Escolha o tipo de pedido." };
  }
  if (!DIA_RE.test(dia)) return { error: "Informe o dia." };
  if (dia > dataLocal(new Date())) {
    return { error: "Não é possível pedir ajuste para um dia que ainda não chegou." };
  }
  if (justificativa.length < 5) {
    return { error: "Explique o motivo (pelo menos algumas palavras)." };
  }
  if (justificativa.length > 1000) {
    return { error: "O motivo está muito longo (máximo de 1.000 caracteres)." };
  }
  // O anexo só pode estar na pasta do próprio funcionário.
  if (anexo && !anexo.startsWith(`${ctx.empresa_id}/${ctx.id}/`)) {
    return { error: "Anexo inválido. Envie o arquivo novamente." };
  }

  const linha: Record<string, unknown> = {
    empresa_id: ctx.empresa_id,
    funcionario_id: ctx.id,
    solicitado_por: ctx.id,
    categoria,
    dia,
    justificativa,
    anexo_path: anexo || null,
    status: "pendente",
  };

  if (categoria === "incluir" || categoria === "alterar") {
    if (!HORA_RE.test(hora)) return { error: "Informe o horário correto." };
    linha.marcado_em = new Date(`${dia}T${hora}:00-03:00`).toISOString();
  }
  if (categoria === "incluir") {
    if (!CICLO.includes(tipo)) return { error: "Escolha qual marcação ficou faltando." };
    linha.tipo = tipo;
  }
  if (categoria === "alterar") {
    const marc = await minhasMarcacoesDoDia(dia);
    const alvo = marc.find((m) => m.id === registroId);
    if (!alvo) return { error: "Escolha qual marcação deve ser corrigida." };
    linha.registro_id = alvo.id;
    linha.tipo = alvo.tipo;
  }

  // Evita pedido repetido para o mesmo caso.
  let dup = ctx.supabase
    .from("ajustes_ponto")
    .select("id")
    .eq("funcionario_id", ctx.id)
    .eq("status", "pendente")
    .eq("categoria", categoria)
    .eq("dia", dia);
  if (categoria === "alterar") dup = dup.eq("registro_id", registroId);
  if (categoria === "incluir") dup = dup.eq("tipo", tipo);
  const { data: existente } = await dup.limit(1);
  if (existente && existente.length > 0) {
    return { error: "Você já tem um pedido igual aguardando o RH." };
  }

  const { error } = await ctx.supabase.from("ajustes_ponto").insert(linha);
  if (error) {
    if (error.code === "42703" || error.code === "PGRST204") {
      return {
        error: "O módulo de solicitações ainda não foi ativado no banco. Avise o RH.",
      };
    }
    return { error: `Não foi possível enviar: ${error.message}` };
  }

  revalidatePath("/app/solicitacoes");
  revalidatePath("/admin/solicitacoes");
  return { ok: true };
}

/** O funcionário cancela um pedido que ainda está pendente. */
export async function cancelarSolicitacao(form: FormData) {
  const ctx = await eu();
  if (!ctx) return;
  const id = String(form.get("id") ?? "");
  // A regra do banco só permite apagar o próprio pedido enquanto pendente.
  await ctx.supabase
    .from("ajustes_ponto")
    .delete()
    .eq("id", id)
    .eq("funcionario_id", ctx.id)
    .eq("status", "pendente");
  revalidatePath("/app/solicitacoes");
}
