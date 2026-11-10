import { redirect } from "next/navigation";
import { createClient, usuarioAtual } from "@/lib/supabase/server";
import { PerfilView } from "@/components/views/PerfilView";

type CercaPerfil = { nome: string; endereco: string | null; raio_metros: number };
type EmpresaPerfil = {
  razao_social: string | null;
  nome_fantasia: string | null;
  cercas: CercaPerfil[];
};

export default async function Perfil() {
  const supabase = createClient();
  const user = await usuarioAtual(supabase);
  if (!user) redirect("/login");

  // Funcionário + empresa + cerca ativa + biometria numa única query.
  const { data: func } = await supabase
    .from("funcionarios")
    .select(
      `id, matricula, nome, cargo, papel,
       biometria_facial(funcionario_id),
       empresa:empresas!empresa_id(razao_social, nome_fantasia,
         cercas(nome, endereco, raio_metros))`,
    )
    .eq("user_id", user.id)
    .eq("empresa.cercas.ativo", true)
    .maybeSingle();
  if (!func) redirect("/app");

  const empresa = (
    Array.isArray(func.empresa) ? func.empresa[0] : func.empresa
  ) as unknown as EmpresaPerfil | null;
  const bio = func.biometria_facial;

  return (
    <PerfilView
      nome={func.nome}
      cargo={func.cargo}
      matricula={func.matricula}
      papel={func.papel}
      empresa={empresa?.nome_fantasia ?? empresa?.razao_social ?? null}
      temFace={Array.isArray(bio) ? bio.length > 0 : Boolean(bio)}
      cerca={empresa?.cercas?.[0] ?? null}
    />
  );
}
