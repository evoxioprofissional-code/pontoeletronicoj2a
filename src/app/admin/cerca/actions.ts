"use server";

import { revalidatePath } from "next/cache";
import { createClient, usuarioAtual } from "@/lib/supabase/server";

async function gestorEmpresa() {
  const supabase = createClient();
  const user = await usuarioAtual(supabase);
  if (!user) return null;
  const { data } = await supabase
    .from("funcionarios")
    .select("empresa_id, papel")
    .eq("user_id", user.id)
    .single();
  if (!data || (data.papel !== "rh" && data.papel !== "admin")) return null;
  return { supabase, empresaId: data.empresa_id };
}

export type CercaState = { ok?: boolean; error?: string };

export async function salvarCerca(
  _prev: CercaState,
  formData: FormData,
): Promise<CercaState> {
  const ctx = await gestorEmpresa();
  if (!ctx) return { error: "Sem permissão." };
  const { supabase, empresaId } = ctx;

  const nome = String(formData.get("nome") ?? "").trim() || "Fábrica";
  const endereco = String(formData.get("endereco") ?? "").trim();
  const lat = Number(formData.get("latitude"));
  const lng = Number(formData.get("longitude"));
  const raio = Math.max(20, Math.round(Number(formData.get("raio_metros"))));

  if (!isFinite(lat) || !isFinite(lng) || lat < -90 || lat > 90) {
    return { error: "Coordenadas inválidas." };
  }
  if (!isFinite(raio)) return { error: "Raio inválido." };

  const dados = {
    nome,
    endereco: endereco || null,
    latitude: lat,
    longitude: lng,
    raio_metros: raio,
    ativo: true,
  };

  const { data: existente } = await supabase
    .from("cercas")
    .select("id")
    .eq("empresa_id", empresaId)
    .limit(1)
    .maybeSingle();

  const res = existente
    ? await supabase.from("cercas").update(dados).eq("id", existente.id)
    : await supabase.from("cercas").insert({ ...dados, empresa_id: empresaId });

  if (res.error) return { error: `Falha ao salvar: ${res.error.message}` };

  revalidatePath("/admin/cerca");
  return { ok: true };
}

export type GeoResult =
  | { lat: number; lng: number; display: string }
  | { error: string };

/** Geocodifica um endereço via OpenStreetMap (Nominatim). */
export async function geocodificar(endereco: string): Promise<GeoResult> {
  const q = endereco.trim();
  if (q.length < 4) return { error: "Digite um endereço mais completo." };
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(
      q,
    )}`;
    const r = await fetch(url, {
      headers: { "User-Agent": "j2aponto/1.0 (ponto eletronico)" },
      cache: "no-store",
    });
    const arr = (await r.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;
    if (!arr.length) return { error: "Endereço não encontrado." };
    return {
      lat: Number(arr[0].lat),
      lng: Number(arr[0].lon),
      display: arr[0].display_name,
    };
  } catch {
    return { error: "Não foi possível buscar o endereço agora." };
  }
}
