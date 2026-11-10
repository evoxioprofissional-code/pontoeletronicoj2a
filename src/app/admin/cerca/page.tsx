import { createClient, usuarioAtual } from "@/lib/supabase/server";
import { CercaForm } from "@/components/dash/CercaForm";
import { PinIcon } from "@/components/icons";

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

  const init = cerca
    ? {
        nome: cerca.nome,
        endereco: cerca.endereco ?? "",
        latitude: cerca.latitude,
        longitude: cerca.longitude,
        raio_metros: cerca.raio_metros,
      }
    : null;

  return (
    <div className="px-5 py-6 lg:px-8">
      <header className="mb-5">
        <h1 className="flex items-center gap-2 text-xl font-semibold text-ink">
          <PinIcon className="h-6 w-6 text-amber" />
          Cerca virtual
        </h1>
        <p className="text-sm text-muted">
          Defina o local da fábrica e o raio permitido para bater ponto.
        </p>
      </header>

      <div className="max-w-xl rounded-2xl border border-steel-line bg-steel p-5">
        <CercaForm init={init} />
      </div>

      <p className="mt-4 max-w-xl text-xs text-muted">
        Dica: estando na fábrica, use <strong>&quot;Usar minha localização
        atual&quot;</strong> para fixar o ponto exato. O raio define até quantos
        metros dali o funcionário consegue registrar o ponto.
      </p>
    </div>
  );
}
