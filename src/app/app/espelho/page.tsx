import { redirect } from "next/navigation";
import { createClient, usuarioAtual } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { EspelhoView } from "@/components/views/EspelhoView";
import { carregarBanco, empresaInfo } from "@/lib/relatorios";
import { mesValido } from "@/lib/banco";
import { dataLocal } from "@/lib/ponto";

/** Espelho de ponto do próprio funcionário. */
export default async function MeuEspelho({
  searchParams,
}: {
  searchParams: { mes?: string };
}) {
  const supabase = createClient();
  const user = await usuarioAtual(supabase);
  if (!user) redirect("/login");

  const { data: eu } = await supabase
    .from("funcionarios")
    .select(
      "id, nome, papel, empresa_id, empresa:empresas!empresa_id(razao_social, nome_fantasia, cnpj)",
    )
    .eq("user_id", user.id)
    .maybeSingle();
  if (!eu) redirect("/app");

  const hoje = dataLocal(new Date());
  const mesAtual = hoje.slice(0, 7);
  const mes = mesValido(searchParams.mes) ?? mesAtual;
  const [linha] = await carregarBanco(supabase, eu.empresa_id, mes, eu.id);
  if (!linha) redirect("/app");

  return (
    <AppShell
      nome={eu.nome}
      gestor={eu.papel === "rh" || eu.papel === "admin"}
      abaAtiva="/app/registros"
    >
      <EspelhoView
        empresa={empresaInfo(eu.empresa)}
        pessoa={linha.pessoa}
        banco={linha.banco}
        mesAtual={mesAtual}
        hoje={hoje}
        base="/app/espelho"
        voltar={{ href: "/app/registros", rotulo: "Meus registros" }}
      />
    </AppShell>
  );
}
