import { redirect } from "next/navigation";
import { createClient, usuarioAtual } from "@/lib/supabase/server";
import {
  RegistrosView,
  type DiaRegistro,
} from "@/components/views/RegistrosView";
import { limitesDoMes, dataLocal, type MarcacaoLite } from "@/lib/ponto";

export default async function Registros() {
  const supabase = createClient();
  const user = await usuarioAtual(supabase);
  if (!user) redirect("/login");

  // Funcionário + marcações do mês numa única query.
  const agora = new Date();
  const { inicio } = limitesDoMes(agora);
  const { data: func } = await supabase
    .from("funcionarios")
    .select(
      `id, nome, papel,
       mes:registros_ponto!funcionario_id(tipo, marcado_em)`,
    )
    .eq("user_id", user.id)
    .gte("mes.marcado_em", inicio)
    .order("marcado_em", { referencedTable: "mes", ascending: false })
    .maybeSingle();
  if (!func) redirect("/app");

  // Agrupa por dia (a consulta já vem do mais recente para o mais antigo).
  const porDia = new Map<string, MarcacaoLite[]>();
  for (const m of (func.mes ?? []) as MarcacaoLite[]) {
    const chave = dataLocal(new Date(m.marcado_em));
    const arr = porDia.get(chave) ?? [];
    arr.push(m);
    porDia.set(chave, arr);
  }
  const dias: DiaRegistro[] = [...porDia.entries()].map(([chave, marcacoes]) => ({
    chave,
    marcacoes,
  }));

  return (
    <RegistrosView
      nome={func.nome}
      gestor={func.papel === "rh" || func.papel === "admin"}
      dias={dias}
      hoje={dataLocal(agora)}
    />
  );
}
