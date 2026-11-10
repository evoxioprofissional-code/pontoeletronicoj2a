import { redirect } from "next/navigation";
import { createClient, usuarioAtual } from "@/lib/supabase/server";
import { HomeView } from "@/components/views/HomeView";
import { SemVinculo } from "@/components/views/SemVinculo";
import type { CercaCliente } from "@/components/PontoCliente";
import {
  minutosTrabalhados,
  limitesDoDia,
  type MarcacaoLite,
} from "@/lib/ponto";

export default async function AppHome() {
  const supabase = createClient();
  const user = await usuarioAtual(supabase);
  if (!user) redirect("/login");

  // Uma única query: funcionário + cercas ativas + biometria + marcações do dia.
  const { inicio, fim } = limitesDoDia(new Date());
  const { data: func } = await supabase
    .from("funcionarios")
    .select(
      `id, nome, papel, carga_horaria_min,
       biometria_facial(funcionario_id),
       empresa:empresas!empresa_id(cercas(nome, latitude, longitude, raio_metros)),
       hoje:registros_ponto!funcionario_id(tipo, marcado_em)`,
    )
    .eq("user_id", user.id)
    .eq("empresa.cercas.ativo", true)
    .gte("hoje.marcado_em", inicio)
    .lte("hoje.marcado_em", fim)
    .order("marcado_em", { referencedTable: "hoje" })
    .maybeSingle();

  if (!func) return <SemVinculo />;

  const empresa = (
    Array.isArray(func.empresa) ? func.empresa[0] : func.empresa
  ) as { cercas: CercaCliente[] } | null;
  const marcacoes = (func.hoje ?? []) as MarcacaoLite[];
  const bio = func.biometria_facial;

  return (
    <HomeView
      nome={func.nome}
      gestor={func.papel === "rh" || func.papel === "admin"}
      cercas={empresa?.cercas ?? []}
      temFace={Array.isArray(bio) ? bio.length > 0 : Boolean(bio)}
      marcacoes={marcacoes}
      cargaMin={func.carga_horaria_min ?? 480}
      trabalhadoMin={minutosTrabalhados(marcacoes)}
    />
  );
}
