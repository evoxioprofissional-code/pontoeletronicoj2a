"use server";

import { revalidatePath } from "next/cache";
import { contextoGestor } from "@/lib/relatorios";
import { usuarioAtual } from "@/lib/supabase/server";

export type EstadoFerias = { ok?: string; error?: string };

const DIA = /^\d{4}-\d{2}-\d{2}$/;

export async function lancarFerias(
  _p: EstadoFerias,
  form: FormData,
): Promise<EstadoFerias> {
  const ctx = await contextoGestor();
  if (!ctx) return { error: "Sem permissão." };
  const funcionarioId = String(form.get("funcionario_id") ?? "");
  const inicio = String(form.get("inicio") ?? "");
  const fim = String(form.get("fim") ?? "");
  const observacao = String(form.get("observacao") ?? "").trim().slice(0, 300);
  if (!funcionarioId) return { error: "Escolha o colaborador." };
  if (!DIA.test(inicio) || !DIA.test(fim)) return { error: "Informe o início e o fim." };
  if (fim < inicio) return { error: "O fim não pode ser antes do início." };
  const dias = Math.round((+new Date(fim) - +new Date(inicio)) / 86_400_000) + 1;
  if (dias > 30) return { error: "Um período de férias tem no máximo 30 dias." };

  const { data: f } = await ctx.supabase
    .from("funcionarios")
    .select("id, empresa_id")
    .eq("id", funcionarioId)
    .maybeSingle();
  if (!f || f.empresa_id !== ctx.empresaId) return { error: "Colaborador não encontrado." };

  // Não deixa sobrepor outro período da mesma pessoa.
  const { data: choque } = await ctx.supabase
    .from("ferias")
    .select("id")
    .eq("funcionario_id", funcionarioId)
    .lte("inicio", fim)
    .gte("fim", inicio)
    .limit(1);
  if (choque && choque.length > 0) {
    return { error: "Já existem férias lançadas nesse período para essa pessoa." };
  }

  const user = await usuarioAtual(ctx.supabase);
  const { data: eu } = user
    ? await ctx.supabase.from("funcionarios").select("id").eq("user_id", user.id).maybeSingle()
    : { data: null };

  const { error } = await ctx.supabase.from("ferias").insert({
    empresa_id: ctx.empresaId,
    funcionario_id: funcionarioId,
    inicio,
    fim,
    observacao: observacao || null,
    criado_por: eu?.id ?? null,
  });
  if (error) return { error: `Não foi possível lançar: ${error.message}` };
  revalidatePath("/admin", "layout");
  return { ok: `Férias lançadas: ${dias} dias.` };
}

export async function excluirFerias(form: FormData) {
  const ctx = await contextoGestor();
  if (!ctx) return;
  const id = String(form.get("id") ?? "");
  await ctx.supabase.from("ferias").delete().eq("id", id).eq("empresa_id", ctx.empresaId);
  revalidatePath("/admin", "layout");
}
