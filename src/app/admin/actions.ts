"use server";

import { revalidatePath } from "next/cache";
import { createClient, usuarioAtual } from "@/lib/supabase/server";
import type { TipoDB } from "@/lib/ponto";

type DB = ReturnType<typeof createClient>;

/** Garante que o usuário logado é gestor (rh/admin). Retorna id + empresa. */
async function gestor(supabase: DB) {
  const user = await usuarioAtual(supabase);
  if (!user) return null;
  const { data } = await supabase
    .from("funcionarios")
    .select("id, empresa_id, papel")
    .eq("user_id", user.id)
    .single();
  if (!data || (data.papel !== "rh" && data.papel !== "admin")) return null;
  return data;
}

async function mesmaEmpresa(
  supabase: DB,
  funcionarioId: string,
  empresaId: string,
) {
  const { data } = await supabase
    .from("funcionarios")
    .select("empresa_id")
    .eq("id", funcionarioId)
    .single();
  return data?.empresa_id === empresaId;
}

function isoLocal(dia: string, hora: string): string | null {
  const d = new Date(`${dia}T${hora}:00`);
  return isNaN(+d) ? null : d.toISOString();
}

export async function definirCarga(formData: FormData) {
  const supabase = createClient();
  const g = await gestor(supabase);
  if (!g) return;
  const funcionarioId = String(formData.get("funcionarioId") ?? "");
  const horas = Number(formData.get("horas") ?? 0);
  const minutos = Number(formData.get("minutos") ?? 0);
  const total = Math.max(0, Math.round(horas * 60 + minutos));

  if (!(await mesmaEmpresa(supabase, funcionarioId, g.empresa_id))) return;
  await supabase
    .from("funcionarios")
    .update({ carga_horaria_min: total })
    .eq("id", funcionarioId);
  revalidatePath("/admin", "layout");
}

export async function ajustarMarcacao(formData: FormData) {
  const supabase = createClient();
  const g = await gestor(supabase);
  if (!g) return;
  const registroId = String(formData.get("registroId") ?? "");
  const dia = String(formData.get("dia") ?? "");
  const hora = String(formData.get("hora") ?? "");
  const motivo = String(formData.get("motivo") ?? "").trim();
  const iso = isoLocal(dia, hora);
  if (!iso) return;

  const { data: reg } = await supabase
    .from("registros_ponto")
    .select("empresa_id, marcado_em, marcado_em_original")
    .eq("id", registroId)
    .single();
  if (!reg || reg.empresa_id !== g.empresa_id) return;

  await supabase
    .from("registros_ponto")
    .update({
      marcado_em: iso,
      marcado_em_original: reg.marcado_em_original ?? reg.marcado_em,
      ajustado: true,
      ajuste_motivo: motivo || "Ajuste do administrador",
      ajustado_por: g.id,
      ajustado_em: new Date().toISOString(),
    })
    .eq("id", registroId);
  revalidatePath("/admin", "layout");
}

export async function adicionarMarcacao(formData: FormData) {
  const supabase = createClient();
  const g = await gestor(supabase);
  if (!g) return;
  const funcionarioId = String(formData.get("funcionarioId") ?? "");
  const tipo = String(formData.get("tipo") ?? "") as TipoDB;
  const dia = String(formData.get("dia") ?? "");
  const hora = String(formData.get("hora") ?? "");
  const iso = isoLocal(dia, hora);
  if (!iso) return;

  if (!(await mesmaEmpresa(supabase, funcionarioId, g.empresa_id))) return;
  await supabase.from("registros_ponto").insert({
    empresa_id: g.empresa_id,
    funcionario_id: funcionarioId,
    tipo,
    marcado_em: iso,
    metodo_verificacao: "manual",
    dentro_cerca: false,
    ajustado: true,
    ajuste_motivo: "Inclusão manual pelo administrador",
    ajustado_por: g.id,
    ajustado_em: new Date().toISOString(),
  });
  revalidatePath("/admin", "layout");
}

export async function excluirMarcacao(formData: FormData) {
  const supabase = createClient();
  const g = await gestor(supabase);
  if (!g) return;
  const registroId = String(formData.get("registroId") ?? "");
  const { data: reg } = await supabase
    .from("registros_ponto")
    .select("empresa_id")
    .eq("id", registroId)
    .single();
  if (!reg || reg.empresa_id !== g.empresa_id) return;
  await supabase.from("registros_ponto").delete().eq("id", registroId);
  revalidatePath("/admin", "layout");
}
