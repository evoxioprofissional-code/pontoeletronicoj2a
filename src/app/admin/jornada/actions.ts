"use server";

import { revalidatePath } from "next/cache";
import { contextoGestor } from "@/lib/relatorios";
import { escalaValida, type DiaTurno, type Escala } from "@/lib/turnos";
import { feriadosNacionais } from "@/lib/feriados";

export type Estado = { ok?: string; error?: string };

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const DIA = /^\d{4}-\d{2}-\d{2}$/;

function atualizar() {
  revalidatePath("/admin", "layout");
}

function erroBanco(msg: string, code?: string): string {
  if (code === "23505") return "Já existe um cadastro com esse nome.";
  if (code === "42P01" || code === "PGRST205") {
    return "Este módulo ainda não foi ativado no banco (rode o script 0006 no Supabase).";
  }
  return msg;
}

/* ------------------------------ Turnos ------------------------------ */

/** Lê a escala de 7 dias do formulário (campos d0_ativo, d0_entrada…). */
function escalaDoForm(form: FormData): Escala | string {
  const escala: (DiaTurno | null)[] = [];
  for (let i = 0; i < 7; i++) {
    if (form.get(`d${i}_ativo`) !== "on") {
      escala.push(null);
      continue;
    }
    const entrada = String(form.get(`d${i}_entrada`) ?? "");
    const saida = String(form.get(`d${i}_saida`) ?? "");
    const intervalo = Number(form.get(`d${i}_intervalo`) ?? 0);
    if (!HORA.test(entrada) || !HORA.test(saida)) {
      return "Preencha a entrada e a saída de todos os dias marcados.";
    }
    if (entrada === saida) return "A entrada e a saída não podem ser iguais.";
    escala.push({ entrada, saida, intervalo: Math.max(0, Math.round(intervalo)) });
  }
  if (escala.every((d) => d === null)) return "Marque pelo menos um dia de trabalho.";
  return escalaValida(escala) ?? "Horários inválidos.";
}

export async function salvarTurno(_p: Estado, form: FormData): Promise<Estado> {
  const ctx = await contextoGestor();
  if (!ctx) return { error: "Sem permissão." };
  const id = String(form.get("id") ?? "");
  const nome = String(form.get("nome") ?? "").trim().slice(0, 80);
  const tolerancia = Math.min(60, Math.max(0, Math.round(Number(form.get("tolerancia") ?? 10))));
  if (!nome) return { error: "Dê um nome ao turno." };
  const escala = escalaDoForm(form);
  if (typeof escala === "string") return { error: escala };

  const dados = { nome, escala, tolerancia_min: tolerancia };
  const { error } = id
    ? await ctx.supabase.from("turnos").update(dados).eq("id", id).eq("empresa_id", ctx.empresaId)
    : await ctx.supabase.from("turnos").insert({ ...dados, empresa_id: ctx.empresaId });
  if (error) return { error: erroBanco(error.message, error.code) };
  atualizar();
  return { ok: id ? "Turno atualizado." : "Turno criado." };
}

export async function excluirTurno(form: FormData) {
  const ctx = await contextoGestor();
  if (!ctx) return;
  const id = String(form.get("id") ?? "");
  // Quem estava no turno fica sem turno (volta à jornada diária).
  await ctx.supabase.from("turnos").delete().eq("id", id).eq("empresa_id", ctx.empresaId);
  atualizar();
}

/* ------------------------------ Equipes ----------------------------- */

export async function criarEquipe(_p: Estado, form: FormData): Promise<Estado> {
  const ctx = await contextoGestor();
  if (!ctx) return { error: "Sem permissão." };
  const nome = String(form.get("nome") ?? "").trim().slice(0, 60);
  if (!nome) return { error: "Digite o nome da equipe." };
  const { error } = await ctx.supabase
    .from("equipes")
    .insert({ empresa_id: ctx.empresaId, nome });
  if (error) return { error: erroBanco(error.message, error.code) };
  atualizar();
  return { ok: `Equipe "${nome}" criada.` };
}

export async function excluirEquipe(form: FormData) {
  const ctx = await contextoGestor();
  if (!ctx) return;
  const id = String(form.get("id") ?? "");
  await ctx.supabase.from("equipes").delete().eq("id", id).eq("empresa_id", ctx.empresaId);
  atualizar();
}

/* ------------------------------ Feriados ---------------------------- */

export async function criarFeriado(_p: Estado, form: FormData): Promise<Estado> {
  const ctx = await contextoGestor();
  if (!ctx) return { error: "Sem permissão." };
  const data = String(form.get("data") ?? "");
  const nome = String(form.get("nome") ?? "").trim().slice(0, 80);
  if (!DIA.test(data)) return { error: "Escolha a data." };
  if (!nome) return { error: "Digite o nome do feriado." };
  const { error } = await ctx.supabase
    .from("feriados")
    .insert({ empresa_id: ctx.empresaId, data, nome });
  if (error) {
    return {
      error: error.code === "23505" ? "Já existe um feriado nessa data." : erroBanco(error.message, error.code),
    };
  }
  atualizar();
  return { ok: "Feriado adicionado." };
}

/** Adiciona os feriados nacionais do ano (pula os que já existem). */
export async function importarNacionais(_p: Estado, form: FormData): Promise<Estado> {
  const ctx = await contextoGestor();
  if (!ctx) return { error: "Sem permissão." };
  const ano = Math.round(Number(form.get("ano")));
  if (!(ano >= 2000 && ano <= 2100)) return { error: "Ano inválido." };
  const facultativos = form.get("facultativos") === "on";
  const lista = feriadosNacionais(ano).filter((f) => facultativos || !f.facultativo);
  const { data, error } = await ctx.supabase
    .from("feriados")
    .upsert(
      lista.map((f) => ({ empresa_id: ctx.empresaId, data: f.data, nome: f.nome })),
      { onConflict: "empresa_id,data", ignoreDuplicates: true },
    )
    .select("id");
  if (error) return { error: erroBanco(error.message, error.code) };
  atualizar();
  const n = data?.length ?? 0;
  return {
    ok: n === 0 ? `Os feriados de ${ano} já estavam cadastrados.` : `${n} feriados de ${ano} adicionados.`,
  };
}

export async function excluirFeriado(form: FormData) {
  const ctx = await contextoGestor();
  if (!ctx) return;
  const id = String(form.get("id") ?? "");
  await ctx.supabase.from("feriados").delete().eq("id", id).eq("empresa_id", ctx.empresaId);
  atualizar();
}
