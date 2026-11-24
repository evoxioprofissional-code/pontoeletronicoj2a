"use server";

import { revalidatePath } from "next/cache";
import { createClient, usuarioAtual } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DIA_RE,
  EMAIL_RE,
  cpfValido,
  dataDeTexto,
  formatarCpf,
  lerCsv,
  opcional,
  pisValido,
  senhaInicial,
  soDigitos,
} from "@/lib/cadastro";

export type NovoState = { ok?: boolean; error?: string };

async function gestorEmpresa() {
  const supabase = createClient();
  const user = await usuarioAtual(supabase);
  if (!user) return null;
  const { data } = await supabase
    .from("funcionarios")
    .select("id, empresa_id, papel")
    .eq("user_id", user.id)
    .single();
  if (!data || (data.papel !== "rh" && data.papel !== "admin")) return null;
  return { supabase, empresaId: data.empresa_id as string, meuId: data.id as string };
}

/**
 * A criação de login exige a chave secreta do Supabase na Vercel. Aceita o
 * formato antigo (JWT "service_role") e o novo ("sb_secret_…").
 */
function chaveServicoOk(): boolean {
  const sk = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  for (let i = 0; i < sk.length; i++) if (sk.charCodeAt(i) > 255) return false;
  return sk.startsWith("sb_secret_") || sk.split(".").length === 3;
}

const SEM_CHAVE =
  "Cadastro indisponível: a chave secreta do Supabase (SUPABASE_SERVICE_ROLE_KEY) não está configurada na Vercel.";

interface DadosNovo {
  nome: string;
  email: string;
  senha: string;
  matricula: string;
  cargo: string | null;
  papel: string;
  carga: number;
  cpf: string | null;
  admissao: string | null;
  equipeId: string | null;
  turnoId: string | null;
}

/** Cria login + funcionário. Devolve mensagem de erro ou null. */
async function criarUm(empresaId: string, d: DadosNovo): Promise<string | null> {
  const admin = createAdminClient();
  let userId: string | null = null;
  try {
    const criado = await admin.auth.admin.createUser({
      email: d.email,
      password: d.senha,
      email_confirm: true,
      user_metadata: { nome: d.nome, matricula: d.matricula },
    });
    if (criado.error) {
      const msg = criado.error.message.toLowerCase();
      if (msg.includes("registered") || msg.includes("already")) {
        return "Já existe um usuário com esse e-mail.";
      }
      return `Falha ao criar login: ${criado.error.message}`;
    }
    userId = criado.data.user.id;
  } catch (e) {
    return `Falha ao criar login: ${e instanceof Error ? e.message : "erro"}`;
  }

  const { error } = await admin.from("funcionarios").insert({
    empresa_id: empresaId,
    user_id: userId,
    matricula: d.matricula,
    nome: d.nome,
    cargo: d.cargo,
    papel: d.papel,
    carga_horaria_min: d.carga,
    email: d.email,
    ...(d.cpf ? { cpf: d.cpf } : {}),
    ...(d.admissao ? { data_admissao: d.admissao } : {}),
    ...(d.equipeId ? { equipe_id: d.equipeId } : {}),
    ...(d.turnoId ? { turno_id: d.turnoId } : {}),
  });
  if (error) {
    if (userId) await admin.auth.admin.deleteUser(userId).catch(() => {});
    if (error.code === "23505") return "Matrícula já cadastrada nesta empresa.";
    return `Falha ao salvar funcionário: ${error.message}`;
  }
  return null;
}

export async function criarFuncionario(
  _prev: NovoState,
  formData: FormData,
): Promise<NovoState> {
  const g = await gestorEmpresa();
  if (!g) return { error: "Apenas o RH ou o administrador pode cadastrar." };

  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");
  const matricula = String(formData.get("matricula") ?? "").trim();
  const papel = String(formData.get("papel") ?? "funcionario");
  const horas = Number(formData.get("horas") ?? 8);
  const minutos = Number(formData.get("minutos") ?? 0);
  const cpf = opcional(formData, "cpf", 20);
  const admissao = opcional(formData, "data_admissao", 10);

  if (!nome || !email || !matricula) return { error: "Preencha nome, e-mail e matrícula." };
  if (!EMAIL_RE.test(email)) return { error: "E-mail inválido." };
  if (senha.length < 6) return { error: "A senha deve ter ao menos 6 caracteres." };
  if (!["funcionario", "rh", "admin"].includes(papel)) return { error: "Perfil inválido." };
  if (cpf && !cpfValido(cpf)) return { error: "CPF inválido. Confira os números." };
  if (admissao && !DIA_RE.test(admissao)) return { error: "Data de admissão inválida." };
  if (!chaveServicoOk()) return { error: SEM_CHAVE };

  const erro = await criarUm(g.empresaId, {
    nome,
    email,
    senha,
    matricula,
    cargo: opcional(formData, "cargo", 80),
    papel,
    carga: Math.max(0, Math.round(horas * 60 + minutos)) || 480,
    cpf: cpf ? formatarCpf(cpf) : null,
    admissao,
    equipeId: opcional(formData, "equipe_id", 40),
    turnoId: opcional(formData, "turno_id", 40),
  });
  if (erro) return { error: erro };

  revalidatePath("/admin", "layout");
  return { ok: true };
}

/* ---------------------- Edição do cadastro ---------------------- */

export type CadastroState = { ok?: string; error?: string };

export async function salvarCadastro(
  _prev: CadastroState,
  form: FormData,
): Promise<CadastroState> {
  const g = await gestorEmpresa();
  if (!g) return { error: "Sem permissão." };
  const id = String(form.get("id") ?? "");

  const { data: alvo } = await g.supabase
    .from("funcionarios")
    .select("id, empresa_id, papel")
    .eq("id", id)
    .maybeSingle();
  if (!alvo || alvo.empresa_id !== g.empresaId) return { error: "Colaborador não encontrado." };

  const nome = String(form.get("nome") ?? "").trim().slice(0, 120);
  const matricula = String(form.get("matricula") ?? "").trim().slice(0, 30);
  if (!nome || !matricula) return { error: "Nome e matrícula são obrigatórios." };

  const cpf = opcional(form, "cpf", 20);
  if (cpf && !cpfValido(cpf)) return { error: "CPF inválido. Confira os números." };
  const pis = opcional(form, "pis", 20);
  if (pis && !pisValido(pis)) return { error: "PIS inválido. Confira os números." };
  const email = opcional(form, "email", 120)?.toLowerCase() ?? null;
  if (email && !EMAIL_RE.test(email)) return { error: "E-mail inválido." };

  const datas: Record<string, string | null> = {};
  for (const c of ["data_nascimento", "data_admissao", "turno_programado_em"]) {
    const v = opcional(form, c, 10);
    if (v && !DIA_RE.test(v)) return { error: "Há uma data inválida no formulário." };
    datas[c] = v;
  }
  const turnoProgramado = opcional(form, "turno_programado_id", 40);
  if (turnoProgramado && !datas.turno_programado_em) {
    return { error: "Informe a partir de quando vale o turno programado." };
  }

  const papel = String(form.get("papel") ?? alvo.papel);
  if (!["funcionario", "rh", "admin"].includes(papel)) return { error: "Acesso inválido." };
  // Ninguém tira o próprio acesso de gestor (evita ficar trancado para fora).
  if (alvo.id === g.meuId && papel === "funcionario") {
    return { error: "Você não pode remover o seu próprio acesso de RH/administrador." };
  }
  const gestorId = opcional(form, "gestor_id", 40);
  if (gestorId === alvo.id) return { error: "A pessoa não pode ser gestora dela mesma." };

  const { error } = await g.supabase
    .from("funcionarios")
    .update({
      nome,
      matricula,
      cargo: opcional(form, "cargo", 80),
      email,
      telefone: opcional(form, "telefone", 30),
      cpf: cpf ? formatarCpf(cpf) : null,
      pis: pis ? soDigitos(pis) : null,
      equipe_id: opcional(form, "equipe_id", 40),
      turno_id: opcional(form, "turno_id", 40),
      turno_programado_id: turnoProgramado,
      turno_programado_em: turnoProgramado ? datas.turno_programado_em : null,
      gestor_id: gestorId,
      observacoes: opcional(form, "observacoes", 1000),
      data_nascimento: datas.data_nascimento,
      data_admissao: datas.data_admissao,
      papel,
    })
    .eq("id", id);
  if (error) {
    if (error.code === "23505") return { error: "Essa matrícula já é de outra pessoa." };
    return { error: `Não foi possível salvar: ${error.message}` };
  }
  revalidatePath("/admin", "layout");
  return { ok: "Cadastro salvo." };
}

/** Desliga (ou reativa) um colaborador. O histórico de ponto é mantido. */
export async function alterarVinculo(form: FormData) {
  const g = await gestorEmpresa();
  if (!g) return;
  const id = String(form.get("id") ?? "");
  const acao = String(form.get("acao") ?? "");
  if (id === g.meuId) return; // não se desliga a si mesmo
  const data = String(form.get("data") ?? "");
  const desligar = acao === "desligar";
  await g.supabase
    .from("funcionarios")
    .update({
      ativo: !desligar,
      desligado_em: desligar ? (DIA_RE.test(data) ? data : new Date().toISOString().slice(0, 10)) : null,
    })
    .eq("id", id)
    .eq("empresa_id", g.empresaId);
  revalidatePath("/admin", "layout");
}

/* ---------------------- Importação por planilha ---------------------- */

export interface ResultadoImportacao {
  error?: string;
  linhas?: { linha: number; nome: string; email: string; senha?: string; erro?: string }[];
}

/**
 * Importa colaboradores de uma planilha CSV. Colunas reconhecidas:
 * nome, matricula, email, senha (opcional — gera uma se vazia), cargo, cpf,
 * admissao, equipe (nome), turno (nome), horas_dia.
 */
export async function importarColaboradores(
  _prev: ResultadoImportacao,
  form: FormData,
): Promise<ResultadoImportacao> {
  const g = await gestorEmpresa();
  if (!g) return { error: "Sem permissão." };
  if (!chaveServicoOk()) return { error: SEM_CHAVE };

  const arquivo = form.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) return { error: "Escolha o arquivo CSV." };
  if (arquivo.size > 1_000_000) return { error: "Arquivo muito grande (máximo 1 MB)." };
  const linhas = lerCsv(await arquivo.text());
  if (linhas.length === 0) return { error: "Não encontrei linhas no arquivo. A primeira linha deve ser o cabeçalho." };
  if (linhas.length > 300) return { error: "Importe no máximo 300 pessoas por vez." };
  if (!("nome" in linhas[0]) || !("email" in linhas[0] || "e_mail" in linhas[0])) {
    return { error: "O arquivo precisa das colunas “nome”, “matricula” e “email”." };
  }

  const [{ data: equipes }, { data: turnos }] = await Promise.all([
    g.supabase.from("equipes").select("id, nome").eq("empresa_id", g.empresaId),
    g.supabase.from("turnos").select("id, nome").eq("empresa_id", g.empresaId),
  ]);
  const chave = (s: string) => s.trim().toLowerCase();
  const equipePor = new Map((equipes ?? []).map((e) => [chave(e.nome), e.id as string]));
  const turnoPor = new Map((turnos ?? []).map((t) => [chave(t.nome), t.id as string]));

  const resultado: NonNullable<ResultadoImportacao["linhas"]> = [];
  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i];
    const nome = (l.nome ?? "").trim();
    const email = (l.email ?? l.e_mail ?? "").trim().toLowerCase();
    const matricula = (l.matricula ?? "").trim();
    const cpf = (l.cpf ?? "").trim();
    const admissaoTxt = (l.admissao ?? l.data_admissao ?? "").trim();
    const admissao = admissaoTxt ? dataDeTexto(admissaoTxt) : null;
    const base = { linha: i + 2, nome: nome || "—", email: email || "—" };

    let erro: string | null = null;
    if (!nome || !email || !matricula) erro = "Faltam nome, e-mail ou matrícula.";
    else if (!EMAIL_RE.test(email)) erro = "E-mail inválido.";
    else if (cpf && !cpfValido(cpf)) erro = "CPF inválido.";
    else if (admissaoTxt && !admissao) erro = "Data de admissão inválida (use DD/MM/AAAA).";
    if (erro) {
      resultado.push({ ...base, erro });
      continue;
    }

    const senha = (l.senha ?? "").length >= 6 ? l.senha : senhaInicial();
    const horas = Number(String(l.horas_dia ?? "").replace(",", "."));
    const e = await criarUm(g.empresaId, {
      nome,
      email,
      senha,
      matricula,
      cargo: (l.cargo ?? "").trim() || null,
      papel: "funcionario",
      carga: horas > 0 && horas <= 24 ? Math.round(horas * 60) : 480,
      cpf: cpf ? formatarCpf(cpf) : null,
      admissao,
      equipeId: l.equipe ? (equipePor.get(chave(l.equipe)) ?? null) : null,
      turnoId: l.turno ? (turnoPor.get(chave(l.turno)) ?? null) : null,
    });
    resultado.push(e ? { ...base, erro: e } : { ...base, senha });
  }

  revalidatePath("/admin", "layout");
  return { linhas: resultado };
}
