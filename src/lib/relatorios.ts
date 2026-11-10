import "server-only";
import { createClient, usuarioAtual } from "@/lib/supabase/server";
import { calcularMes, limitesDeMes, type MesBanco } from "@/lib/banco";
import type { TipoDB } from "@/lib/ponto";

type DB = ReturnType<typeof createClient>;

export interface MarcacaoBanco {
  tipo: TipoDB;
  marcado_em: string;
  metodo_verificacao: string;
  ajustado: boolean;
}

export interface PessoaBanco {
  id: string;
  matricula: string;
  nome: string;
  cargo: string | null;
  ativo: boolean;
  cargaMin: number;
}

export interface EmpresaInfo {
  nome: string | null;
  cnpj: string | null;
}

export interface LinhaBanco {
  pessoa: PessoaBanco;
  banco: MesBanco<MarcacaoBanco>;
}

const PAGINA = 1000;

/**
 * Busca TODAS as linhas de uma consulta, página por página.
 * O Supabase devolve no máximo 1.000 linhas por requisição; sem isto, o banco
 * de horas ficaria silenciosamente incompleto quando a empresa crescesse.
 */
async function todasAsLinhas<T>(
  pagina: (
    de: number,
    ate: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const linhas: T[] = [];
  for (let de = 0; ; de += PAGINA) {
    const { data, error } = await pagina(de, de + PAGINA - 1);
    if (error) throw new Error(`Falha ao consultar registros: ${error.message}`);
    linhas.push(...(data ?? []));
    if (!data || data.length < PAGINA) return linhas;
  }
}

/** Usuário logado, se for gestor (RH/admin), com a empresa dele. */
export async function contextoGestor(): Promise<{
  supabase: DB;
  empresaId: string;
  empresa: EmpresaInfo;
} | null> {
  const supabase = createClient();
  const user = await usuarioAtual(supabase);
  if (!user) return null;
  const { data } = await supabase
    .from("funcionarios")
    .select("papel, empresa_id, empresa:empresas!empresa_id(razao_social, nome_fantasia, cnpj)")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data || (data.papel !== "rh" && data.papel !== "admin")) return null;
  return {
    supabase,
    empresaId: data.empresa_id,
    empresa: empresaInfo(data.empresa),
  };
}

export function empresaInfo(bruto: unknown): EmpresaInfo {
  const e = (Array.isArray(bruto) ? bruto[0] : bruto) as {
    razao_social?: string | null;
    nome_fantasia?: string | null;
    cnpj?: string | null;
  } | null;
  return {
    nome: e?.nome_fantasia ?? e?.razao_social ?? null,
    cnpj: e?.cnpj ?? null,
  };
}

type RegistroBruto = MarcacaoBanco & { funcionario_id: string };

/**
 * Lê as pessoas e TODAS as marcações até o fim do mês indicado (o saldo
 * acumulado depende de todos os meses anteriores). Opcionalmente só de uma
 * pessoa.
 */
export async function carregarBase(
  supabase: DB,
  empresaId: string,
  mes: string,
  funcionarioId?: string,
): Promise<{ pessoas: PessoaBanco[]; registros: Map<string, MarcacaoBanco[]> }> {
  const { fim } = limitesDeMes(mes);

  let consultaPessoas = supabase
    .from("funcionarios")
    .select("id, matricula, nome, cargo, ativo, carga_horaria_min")
    .eq("empresa_id", empresaId)
    .order("nome");
  if (funcionarioId) consultaPessoas = consultaPessoas.eq("id", funcionarioId);

  const [{ data: pessoas, error }, registros] = await Promise.all([
    consultaPessoas,
    todasAsLinhas<RegistroBruto>((de, ate) => {
      let q = supabase
        .from("registros_ponto")
        .select("funcionario_id, tipo, marcado_em, metodo_verificacao, ajustado")
        .eq("empresa_id", empresaId)
        .lte("marcado_em", fim)
        .order("marcado_em")
        .order("id");
      if (funcionarioId) q = q.eq("funcionario_id", funcionarioId);
      return q.range(de, ate);
    }),
  ]);
  if (error) throw new Error(`Falha ao consultar colaboradores: ${error.message}`);

  const porPessoa = new Map<string, MarcacaoBanco[]>();
  for (const { funcionario_id, ...m } of registros) {
    const arr = porPessoa.get(funcionario_id);
    if (arr) arr.push(m);
    else porPessoa.set(funcionario_id, [m]);
  }

  return {
    pessoas: (pessoas ?? []).map((p) => ({
      id: p.id,
      matricula: p.matricula,
      nome: p.nome,
      cargo: p.cargo,
      ativo: p.ativo,
      cargaMin: p.carga_horaria_min ?? 480,
    })),
    registros: porPessoa,
  };
}

/** Banco de horas do mês para a empresa inteira, ou para uma pessoa só. */
export async function carregarBanco(
  supabase: DB,
  empresaId: string,
  mes: string,
  funcionarioId?: string,
): Promise<LinhaBanco[]> {
  const { pessoas, registros } = await carregarBase(
    supabase,
    empresaId,
    mes,
    funcionarioId,
  );
  const agora = new Date();
  return pessoas.map((pessoa) => ({
    pessoa,
    banco: calcularMes(mes, registros.get(pessoa.id) ?? [], pessoa.cargaMin, agora),
  }));
}
