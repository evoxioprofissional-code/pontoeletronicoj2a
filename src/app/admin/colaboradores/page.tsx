import { redirect } from "next/navigation";
import {
  ColaboradoresView,
  type ColaboradorLinha,
} from "@/components/views/admin/ColaboradoresView";
import { contextoGestor } from "@/lib/relatorios";
import {
  minutosTrabalhados,
  limitesDoDia,
  statusDe,
  type MarcacaoLite,
  type TipoDB,
} from "@/lib/ponto";
import { soDigitos } from "@/lib/cadastro";

type Linha = {
  id: string;
  matricula: string;
  nome: string;
  cargo: string | null;
  carga_horaria_min: number | null;
  ativo: boolean;
  cpf?: string | null;
  desligado_em?: string | null;
  equipe_id?: string | null;
  equipe?: { nome: string } | { nome: string }[] | null;
  turno?: { nome: string } | { nome: string }[] | null;
};

const um = <T,>(v: T | T[] | null | undefined): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : (v ?? null);

export default async function Colaboradores({
  searchParams,
}: {
  searchParams: { aba?: string; q?: string; equipe?: string };
}) {
  const ctx = await contextoGestor();
  if (!ctx) redirect("/app");
  const aba = searchParams.aba === "desligados" ? "desligados" : "ativos";
  const busca = (searchParams.q ?? "").trim().slice(0, 60);
  const equipeFiltro = (searchParams.equipe ?? "").slice(0, 40);

  const { inicio, fim } = limitesDoDia(new Date());

  // Colunas do Bloco A; se o script ainda não rodou, cai na consulta simples.
  const completa = await ctx.supabase
    .from("funcionarios")
    .select(
      "id, matricula, nome, cargo, carga_horaria_min, ativo, cpf, desligado_em, equipe_id, equipe:equipes(nome), turno:turnos!turno_id(nome)",
    )
    .eq("empresa_id", ctx.empresaId)
    .order("nome");
  const pessoas: Linha[] = completa.error
    ? (((
        await ctx.supabase
          .from("funcionarios")
          .select("id, matricula, nome, cargo, carga_horaria_min, ativo")
          .eq("empresa_id", ctx.empresaId)
          .order("nome")
      ).data ?? []) as Linha[])
    : ((completa.data ?? []) as Linha[]);

  const [{ data: regs }, eqs, trs] = await Promise.all([
    ctx.supabase
      .from("registros_ponto")
      .select("funcionario_id, tipo, marcado_em")
      .eq("empresa_id", ctx.empresaId)
      .gte("marcado_em", inicio)
      .lte("marcado_em", fim)
      .order("marcado_em"),
    ctx.supabase.from("equipes").select("id, nome").eq("empresa_id", ctx.empresaId).order("nome"),
    ctx.supabase.from("turnos").select("id, nome").eq("empresa_id", ctx.empresaId).order("nome"),
  ]);

  const porFunc = new Map<string, MarcacaoLite[]>();
  for (const r of regs ?? []) {
    const arr = porFunc.get(r.funcionario_id) ?? [];
    arr.push({ tipo: r.tipo as TipoDB, marcado_em: r.marcado_em });
    porFunc.set(r.funcionario_id, arr);
  }

  const termo = busca.toLowerCase();
  const digitos = soDigitos(busca);
  const filtradas = pessoas.filter((f) => {
    if ((aba === "ativos") !== f.ativo) return false;
    if (equipeFiltro && f.equipe_id !== equipeFiltro) return false;
    if (!termo) return true;
    return (
      f.nome.toLowerCase().includes(termo) ||
      f.matricula.toLowerCase().includes(termo) ||
      (digitos.length >= 3 && soDigitos(f.cpf ?? "").includes(digitos))
    );
  });

  const linhas: ColaboradorLinha[] = filtradas.map((f) => {
    const marc = porFunc.get(f.id) ?? [];
    return {
      id: f.id,
      matricula: f.matricula,
      nome: f.nome,
      cargo: f.cargo,
      cargaMin: f.carga_horaria_min ?? 480,
      trabalhadoMin: minutosTrabalhados(marc),
      status: statusDe(marc.map((m) => m.tipo)),
      equipe: um(f.equipe)?.nome ?? null,
      turno: um(f.turno)?.nome ?? null,
      desligadoEm: f.desligado_em ?? null,
    };
  });

  return (
    <ColaboradoresView
      funcionarios={linhas}
      aba={aba}
      busca={busca}
      equipeFiltro={equipeFiltro}
      totais={{
        ativos: pessoas.filter((p) => p.ativo).length,
        desligados: pessoas.filter((p) => !p.ativo).length,
      }}
      equipes={eqs.error ? [] : (eqs.data ?? [])}
      turnos={trs.error ? [] : (trs.data ?? [])}
    />
  );
}
