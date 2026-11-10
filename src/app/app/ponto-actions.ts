"use server";

import { revalidatePath } from "next/cache";
import { createClient, usuarioAtual } from "@/lib/supabase/server";
import { melhorCerca } from "@/lib/geo";
import { compararFace } from "@/lib/face/descriptor";
import {
  proximoTipo,
  limitesDoDia,
  esperaProximaMarcacao,
  rotuloTipo,
  horaLocal,
  type TipoDB,
} from "@/lib/ponto";

async function funcionarioAtual() {
  const supabase = createClient();
  const user = await usuarioAtual(supabase);
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
    const supabase = createClient();
    const agora = new Date().toISOString();
    const { error } = await supabase.from("biometria_facial").upsert({
      funcionario_id: func.id,
      template: JSON.stringify(descriptor),
      consentimento_em: agora,
      atualizado_em: agora,
    });
    if (error) return { error: `Falha ao salvar: ${error.message}` };

    await supabase.from("consentimentos").insert({
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

type CercaRow = {
  id: string;
  nome: string;
  latitude: number;
  longitude: number;
  raio_metros: number;
};

const umOuNulo = <T,>(v: T | T[] | null | undefined): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : (v ?? null);

/**
 * Registra o ponto: valida geofence e rosto no servidor antes de gravar.
 *
 * Desempenho: antes eram 6 idas sequenciais ao Supabase (getUser + 5 queries)
 * mais o router.refresh() do cliente, que refazia tudo de novo. Agora:
 *   - usuário via JWT local (0 requisições),
 *   - funcionário + cercas + biometria + marcações do dia numa ÚNICA query,
 *   - 1 insert.
 */
export async function baterPonto(p: PunchPayload): Promise<PunchResult> {
  if (
    !isFinite(p.lat) ||
    !isFinite(p.lng) ||
    !Array.isArray(p.descriptor) ||
    p.descriptor.length !== 128
  ) {
    return { error: "Dados de captura inválidos. Tente novamente." };
  }

  const supabase = createClient();
  const user = await usuarioAtual(supabase);
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const { inicio, fim } = limitesDoDia(new Date());
  const { data: func, error: errCtx } = await supabase
    .from("funcionarios")
    .select(
      `id, empresa_id,
       biometria_facial(template),
       empresa:empresas!empresa_id(cercas(id, nome, latitude, longitude, raio_metros)),
       hoje:registros_ponto!funcionario_id(tipo, marcado_em)`,
    )
    .eq("user_id", user.id)
    .eq("empresa.cercas.ativo", true)
    .gte("hoje.marcado_em", inicio)
    .lte("hoje.marcado_em", fim)
    .order("marcado_em", { referencedTable: "hoje" })
    .maybeSingle();
  if (errCtx) return { error: `Falha ao consultar: ${errCtx.message}` };
  if (!func) return { error: "Funcionário não encontrado." };

  // 0) Anti-duplicidade — bloqueia marcações em sequência (toque duplo/reenvio)
  const hoje = (func.hoje ?? []) as { tipo: TipoDB; marcado_em: string }[];
  const ultima = hoje[hoje.length - 1];
  const espera = esperaProximaMarcacao(ultima?.marcado_em);
  if (ultima && espera > 0) {
    return {
      error: `Você já registrou ${rotuloTipo(ultima.tipo)} às ${horaLocal(ultima.marcado_em)}. Aguarde ${espera} s para a próxima marcação.`,
    };
  }

  // 1) Geofence — valida no servidor (com tolerância limitada da precisão do GPS)
  const empresa = umOuNulo(func.empresa as unknown as { cercas: CercaRow[] } | null);
  const cercas = (empresa?.cercas ?? []) as CercaRow[];
  if (cercas.length === 0) {
    return { error: "Nenhuma área de fábrica configurada." };
  }
  const geo = melhorCerca({ lat: p.lat, lng: p.lng }, cercas, p.precisao);
  if (!geo || !geo.dentro) {
    const prec = p.precisao ? ` · GPS ±${Math.round(p.precisao)} m` : "";
    return {
      error: `Fora da área permitida (${Math.round(geo?.distancia ?? 0)} m do centro da fábrica, raio ${geo?.cerca.raio_metros ?? "?"} m${prec}).`,
    };
  }

  // 2) Rosto — compara com o template cadastrado (servidor)
  const bio = umOuNulo(func.biometria_facial as unknown as { template: string } | null);
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
  const tipos = hoje.map((r) => r.tipo);
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
      cerca_id: geo.cerca.id,
      dentro_cerca: true,
      metodo_verificacao: "facial",
      face_score: Number(cmp.score.toFixed(3)),
    })
    .select("tipo, marcado_em")
    .single();
  if (error) return { error: `Falha ao registrar: ${error.message}` };

  revalidatePath("/app");
  return {
    ok: true as const,
    tipo: inserido.tipo as TipoDB,
    marcado_em: inserido.marcado_em as string,
    cerca: geo.cerca.nome,
  };
}
