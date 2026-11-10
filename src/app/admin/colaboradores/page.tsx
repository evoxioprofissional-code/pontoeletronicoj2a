import { createClient, usuarioAtual } from "@/lib/supabase/server";
import {
  ColaboradoresView,
  type ColaboradorLinha,
} from "@/components/views/admin/ColaboradoresView";
import {
  minutosTrabalhados,
  limitesDoDia,
  statusDe,
  type MarcacaoLite,
  type TipoDB,
} from "@/lib/ponto";

export default async function Colaboradores() {
  const supabase = createClient();
  const user = await usuarioAtual(supabase);
  const { data: eu } = await supabase
    .from("funcionarios")
    .select("empresa_id")
    .eq("user_id", user!.id)
    .single();

  // Lista e marcações de hoje em paralelo (antes era uma depois da outra).
  const { inicio, fim } = limitesDoDia(new Date());
  const [{ data: funcionarios }, { data: regs }] = await Promise.all([
    supabase
      .from("funcionarios")
      .select("id, matricula, nome, cargo, carga_horaria_min")
      .eq("empresa_id", eu!.empresa_id)
      .order("nome"),
    supabase
      .from("registros_ponto")
      .select("funcionario_id, tipo, marcado_em")
      .eq("empresa_id", eu!.empresa_id)
      .gte("marcado_em", inicio)
      .lte("marcado_em", fim)
      .order("marcado_em"),
  ]);

  const porFunc = new Map<string, MarcacaoLite[]>();
  for (const r of regs ?? []) {
    const arr = porFunc.get(r.funcionario_id) ?? [];
    arr.push({ tipo: r.tipo as TipoDB, marcado_em: r.marcado_em });
    porFunc.set(r.funcionario_id, arr);
  }

  const linhas: ColaboradorLinha[] = (funcionarios ?? []).map((f) => {
    const marc = porFunc.get(f.id) ?? [];
    return {
      id: f.id,
      matricula: f.matricula,
      nome: f.nome,
      cargo: f.cargo,
      cargaMin: f.carga_horaria_min ?? 480,
      trabalhadoMin: minutosTrabalhados(marc),
      status: statusDe(marc.map((m) => m.tipo)),
    };
  });

  return <ColaboradoresView funcionarios={linhas} />;
}
