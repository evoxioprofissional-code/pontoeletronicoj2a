import { redirect } from "next/navigation";
import { createClient, usuarioAtual } from "@/lib/supabase/server";
import {
  FuncionarioView,
  type MarcacaoAdmin,
} from "@/components/views/admin/FuncionarioView";
import {
  CadastroFuncionario,
  type CadastroDados,
} from "@/components/dash/CadastroFuncionario";
import { AvisoMigracao } from "@/components/dash/AvisoMigracao";
import {
  minutosTrabalhados,
  limitesDoDia,
  dataLocal,
  FUSO,
} from "@/lib/ponto";

const DATA_FMT = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO,
  weekday: "long",
  day: "numeric",
  month: "long",
});

export default async function AdminFuncionario({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { d?: string };
}) {
  const supabase = createClient();
  const user = await usuarioAtual(supabase);
  if (!user) redirect("/login");

  const { data: eu } = await supabase
    .from("funcionarios")
    .select("id, papel, empresa_id")
    .eq("user_id", user.id)
    .single();
  if (!eu || (eu.papel !== "rh" && eu.papel !== "admin")) redirect("/app");

  // Dia selecionado (offset em relação a hoje; 0 = hoje, -1 = ontem …)
  const offset = Math.min(0, parseInt(searchParams.d ?? "0", 10) || 0);
  const selData = new Date(Date.now() + offset * 86_400_000);
  const dia = dataLocal(selData);
  const { inicio, fim } = limitesDoDia(selData);

  const [{ data: func }, { data: regs }] = await Promise.all([
    supabase
      .from("funcionarios")
      .select("id, matricula, nome, cargo, carga_horaria_min, empresa_id")
      .eq("id", params.id)
      .single(),
    supabase
      .from("registros_ponto")
      .select("id, tipo, marcado_em, metodo_verificacao, ajustado")
      .eq("funcionario_id", params.id)
      .gte("marcado_em", inicio)
      .lte("marcado_em", fim)
      .order("marcado_em"),
  ]);
  if (!func || func.empresa_id !== eu.empresa_id) redirect("/admin");

  const marcacoes = (regs ?? []) as MarcacaoAdmin[];

  // Cadastro completo (colunas do Bloco A). Se o script ainda não rodou no
  // banco, a consulta falha e mostramos o aviso no lugar do formulário.
  const [cad, eqs, trs, gs] = await Promise.all([
    supabase
      .from("funcionarios")
      .select(
        "id, nome, matricula, cargo, email, telefone, cpf, pis, data_nascimento, data_admissao, desligado_em, ativo, papel, equipe_id, turno_id, turno_programado_id, turno_programado_em, gestor_id, observacoes",
      )
      .eq("id", params.id)
      .maybeSingle(),
    supabase.from("equipes").select("id, nome").eq("empresa_id", eu.empresa_id).order("nome"),
    supabase.from("turnos").select("id, nome").eq("empresa_id", eu.empresa_id).order("nome"),
    supabase
      .from("funcionarios")
      .select("id, nome")
      .eq("empresa_id", eu.empresa_id)
      .eq("ativo", true)
      .order("nome"),
  ]);
  const cadastro =
    cad.error || eqs.error || trs.error || !cad.data ? (
      <AvisoMigracao />
    ) : (
      <CadastroFuncionario
        d={cad.data as CadastroDados}
        equipes={eqs.data ?? []}
        turnos={trs.data ?? []}
        gestores={gs.data ?? []}
        souEu={cad.data.id === eu.id}
      />
    );

  return (
    <FuncionarioView
      func={{
        id: func.id,
        nome: func.nome,
        matricula: func.matricula,
        cargo: func.cargo,
      }}
      cargaMin={func.carga_horaria_min ?? 480}
      trabalhadoMin={minutosTrabalhados(marcacoes)}
      offset={offset}
      dia={dia}
      rotuloDia={
        offset === 0 ? "Hoje" : offset === -1 ? "Ontem" : DATA_FMT.format(selData)
      }
      marcacoes={marcacoes}
      cadastro={cadastro}
    />
  );
}
