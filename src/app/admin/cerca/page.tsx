import { createClient, usuarioAtual } from "@/lib/supabase/server";
import { CercaView } from "@/components/views/admin/CercaView";

export default async function CercaAdmin() {
  const supabase = createClient();
  const user = await usuarioAtual(supabase);
  const { data: eu } = await supabase
    .from("funcionarios")
    .select("empresa_id")
    .eq("user_id", user!.id)
    .single();

  const { data: cerca } = await supabase
    .from("cercas")
    .select("nome, endereco, latitude, longitude, raio_metros")
    .eq("empresa_id", eu!.empresa_id)
    .limit(1)
    .maybeSingle();

  return (
    <CercaView
      init={
        cerca
          ? {
              nome: cerca.nome,
              endereco: cerca.endereco ?? "",
              latitude: cerca.latitude,
              longitude: cerca.longitude,
              raio_metros: cerca.raio_metros,
            }
          : null
      }
    />
  );
}
