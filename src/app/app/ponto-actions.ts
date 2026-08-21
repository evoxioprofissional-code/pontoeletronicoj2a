"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { avaliarCerca } from "@/lib/geo";
import { compararFace } from "@/lib/face/descriptor";
import { proximoTipo, limitesDoDia, type TipoDB } from "@/lib/ponto";

async function funcionarioAtual() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("funcionarios")
    .select("id, empresa_id")
    .eq("user_id", user.id)
    .single();
  return data;
}

export type FaceResult = { error: string } | { ok: true };
export type PunchResult =
  | { error: string }
  | { ok: true; tipo: TipoDB; marcado_em: string; cerca: string };

/** Cadastra/atualiza o rosto do funcionário (descritor de 128 números). */
export async function registrarFace(
  descriptor: number[],
): Promise<FaceResult> {
  if (!Array.isArray(descriptor) || descriptor.length !== 128) {
    const n = Array.isArray(descriptor) ? descriptor.length : "n/a";
    return { error: `Captura inválida (pontos: ${n}). Tente novamente.` };
  }
  const func = await funcionarioAtual();
  if (!func) return { error: "Sessão expirada. Entre novamente." };

  try {
    const admin = createAdminClient();
    const agora = new Date().toISOString();
    const { error } = await admin.from("biometria_facial").upsert({
      funcionario_id: func.id,
      template: JSON.stringify(descriptor),
      consentimento_em: agora,
      atualizado_em: agora,
    });
    if (error) return { error: `Falha ao salvar: ${error.message}` };

    await admin.from("consentimentos").insert({
      funcionario_id: func.id,
      finalidade: "biometria_ponto",
      aceito: true,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "desconhecido";
    return { error: `Erro interno: ${msg}` };
  }

  revalidatePath("/app");
  return { ok: true };
}

export interface PunchPayload {
  lat: number;
  lng: number;
  precisao?: number;
  descriptor: number[];
}

/** Registra o ponto: valida geofence e rosto no servidor antes de gravar. */
export async function baterPonto(p: PunchPayload): Promise<PunchResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const { data: func } = await supabase
    .from("funcionarios")
    .select("id, empresa_id")
    .eq("user_id", user.id)
    .single();
  if (!func) return { error: "Funcionário não encontrado." };

  // 1) Geofence — valida no servidor
  const { data: cercas } = await supabase
    .from("cercas")
    .select("id, nome, latitude, longitude, raio_metros")
    .eq("empresa_id", func.empresa_id)
    .eq("ativo", true);
  if (!cercas || cercas.length === 0) {
    return { error: "Nenhuma área de fábrica configurada." };
  }
  let melhorCerca: (typeof cercas)[number] | null = null;
  let melhorDist = Number.POSITIVE_INFINITY;
  let dentro = false;
  for (const c of cercas) {
    const r = avaliarCerca({ lat: p.lat, lng: p.lng }, c);
    if (r.distancia < melhorDist) {
      melhorDist = r.distancia;
      melhorCerca = c;
      dentro = r.dentro;
    }
  }
  if (!dentro || !melhorCerca) {
    return {
      error: `Fora da área permitida (${Math.round(melhorDist)} m da fábrica).`,
    };
  }

  // 2) Rosto — compara com o template cadastrado (servidor)
  const admin = createAdminClient();
  const { data: bio } = await admin
    .from("biometria_facial")
    .select("template")
    .eq("funcionario_id", func.id)
    .single();
  if (!bio) return { error: "Cadastre seu rosto antes de bater o ponto." };

  let template: number[];
  try {
    template = JSON.parse(bio.template);
  } catch {
    return { error: "Biometria inválida. Cadastre o rosto novamente." };
  }
  const cmp = compararFace(p.descriptor, template);
  if (!cmp.reconhecido) {
    return { error: "Rosto não reconhecido. Tente novamente." };
  }

  // 3) Próximo tipo de marcação (a partir do dia)
  const { inicio, fim } = limitesDoDia(new Date());
  const { data: hoje } = await supabase
    .from("registros_ponto")
    .select("tipo, marcado_em")
    .eq("funcionario_id", func.id)
    .gte("marcado_em", inicio)
    .lte("marcado_em", fim)
    .order("marcado_em");
  const tipos = (hoje ?? []).map((r) => r.tipo as TipoDB);
  const tipo = proximoTipo(tipos);

  // 4) Grava (hash/NSR são selados pelo trigger)
  const { data: inserido, error } = await supabase
    .from("registros_ponto")
    .insert({
      empresa_id: func.empresa_id,
      funcionario_id: func.id,
      tipo,
      latitude: p.lat,
      longitude: p.lng,
      precisao_m: p.precisao ?? null,
      cerca_id: melhorCerca.id,
      dentro_cerca: true,
      metodo_verificacao: "facial",
      face_score: Number(cmp.score.toFixed(3)),
    })
    .select("tipo, marcado_em")
    .single();
  if (error) return { error: "Falha ao registrar o ponto." };

  revalidatePath("/app");
  return {
    ok: true as const,
    tipo: inserido.tipo as TipoDB,
    marcado_em: inserido.marcado_em as string,
    cerca: melhorCerca.nome as string,
  };
}
