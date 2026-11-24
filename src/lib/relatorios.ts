import "server-only";
import { createClient, usuarioAtual } from "@/lib/supabase/server";
import { calcularMes, limitesDeMes, type MesBanco } from "@/lib/banco";
import {
  escalaValida,
  montarRegras,
  type FuncionarioRegras,
  type RegrasPessoa,
  type Turno,
} from "@/lib/turnos";
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

/** Regras extras (turnos, feriados, férias, abonos) — tabelas do Bloco A. */
async function carregarRegras(
  supabase: DB,
  empresaId: string,
  fim: string,
  funcionarioId?: string,
): Promise<Map<string, RegrasPessoa> | null> {
  let qFunc = supabase
    .from("funcionarios")
    .select(
      "id, turno_id, turno_programado_id, turno_programado_em, data_admissao, desligado_em",
    )
    .eq("empresa_id", empresaId);
  if (funcionarioId) qFunc = qFunc.eq("id", funcionarioId);
  let qFerias = supabase
    .from("ferias")
    .select("funcionario_id, inicio, fim")
    .eq("empresa_id", empresaId);
  if (funcionarioId) qFerias = qFerias.eq("funcionario_id", funcionarioId);
  let qAbonos = supabase
    .from("ajustes_ponto")
    .select("funcionario_id, dia")
    .eq("empresa_id", empresaId)
    .eq("categoria", "abonar")
    .eq("status", "aprovado")
    .lte("dia", fim.slice(0, 10));
  if (funcionarioId) qAbonos = qAbonos.eq("funcionario_id", funcionarioId);

  const [f, t, fe, fs, ab] = await Promise.all([
    qFunc,
    supabase.from("turnos").select("id, nome, escala, tolerancia_min").eq("empresa_id", empresaId),
    supabase.from("feriados").select("data, nome").eq("empresa_id", empresaId),
    qFerias,
    qAbonos,
  ]);
  // Script do Bloco A ainda não rodou no banco: segue com as regras antigas.
  if (f.error || t.error || fe.error || fs.error || ab.error) return null;

  const turnos = new Map<string, Turno>();
  for (const x of t.data ?? []) {
    const escala = escalaValida(x.escala);
    if (escala) turnos.set(x.id, { id: x.id, nome: x.nome, escala, tolerancia_min: x.tolerancia_min });
  }
  const feriados = new Map<string, string>(
    (fe.data ?? []).map((x) => [x.data as string, x.nome as string]),
  );
  const feriasPor = new Map<string, { inicio: string; fim: string }[]>();
  for (const x of fs.data ?? []) {
    const arr = feriasPor.get(x.funcionario_id) ?? [];
    arr.push({ inicio: x.inicio, fim: x.fim });
    feriasPor.set(x.funcionario_id, arr);
  }
  const abonosPor = new Map<string, Set<string>>();
  for (const x of ab.data ?? []) {
    if (!x.dia) continue;
    const set = abonosPor.get(x.funcionario_id) ?? new Set<string>();
    set.add(x.dia);
    abonosPor.set(x.funcionario_id, set);
  }

  const out = new Map<string, RegrasPessoa>();
  for (const p of (f.data ?? []) as (FuncionarioRegras & { id: string })[]) {
    const r = montarRegras(
      p,
      turnos,
      feriados,
      feriasPor.get(p.id) ?? [],
      abonosPor.get(p.id) ?? new Set(),
    );
    if (r) out.set(p.id, r);
  }
  return out;
}

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
): Promise<{
  pessoas: PessoaBanco[];
  registros: Map<string, MarcacaoBanco[]>;
  regras: Map<string, RegrasPessoa> | null;
}> {
  const { fim } = limitesDeMes(mes);

  let consultaPessoas = supabase
    .from("funcionarios")
    .select("id, matricula, nome, cargo, ativo, carga_horaria_min")
    .eq("empresa_id", empresaId)
    .order("nome");
  if (funcionarioId) consultaPessoas = consultaPessoas.eq("id", funcionarioId);

  const [{ data: pessoas, error }, registros, regras] = await Promise.all([
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
    carregarRegras(supabase, empresaId, fim, funcionarioId),
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
    regras,
  };
}

/** Banco de horas do mês para a empresa inteira, ou para uma pessoa só. */
export async function carregarBanco(
  supabase: DB,
  empresaId: string,
  mes: string,
  funcionarioId?: string,
): Promise<LinhaBanco[]> {
  const { pessoas, registros, regras } = await carregarBase(
    supabase,
    empresaId,
    mes,
    funcionarioId,
  );
  const agora = new Date();
  return pessoas.map((pessoa) => ({
    pessoa,
    banco: calcularMes(
      mes,
      registros.get(pessoa.id) ?? [],
      pessoa.cargaMin,
      agora,
      regras?.get(pessoa.id),
    ),
  }));
}
