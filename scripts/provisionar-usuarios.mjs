// Cria/atualiza os usuários de login (Supabase Auth) para os funcionários
// existentes e vincula funcionarios.user_id. Idempotente.
//
// Uso:  node --env-file=.env.local scripts/provisionar-usuarios.mjs
//
// A senha padrão abaixo é só para desenvolvimento/piloto. Em produção, cada
// funcionário define a própria no primeiro acesso (fluxo futuro).

import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SENHA_PADRAO = process.env.SENHA_PADRAO || "ponto1234";

if (!URL || !KEY) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const admin = createClient(URL, KEY, { auth: { persistSession: false } });

const emailDe = (matricula) => `${String(matricula).toLowerCase()}@j2aponto.app`;

async function acharUsuarioPorEmail(email) {
  let page = 1;
  // Varre as páginas até encontrar (base pequena; suficiente para o piloto).
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw error;
    const achado = data.users.find((u) => u.email === email);
    if (achado) return achado;
    if (data.users.length < 1000) return null;
    page += 1;
  }
}

async function garantirUsuario(email, nome, matricula) {
  const criado = await admin.auth.admin.createUser({
    email,
    password: SENHA_PADRAO,
    email_confirm: true,
    user_metadata: { nome, matricula },
  });
  if (!criado.error) return criado.data.user.id;

  // Já existe: localiza e redefine a senha para a padrão (idempotência).
  const existente = await acharUsuarioPorEmail(email);
  if (!existente) throw criado.error;
  await admin.auth.admin.updateUserById(existente.id, {
    password: SENHA_PADRAO,
    email_confirm: true,
  });
  return existente.id;
}

async function main() {
  const { data: funcs, error } = await admin
    .from("funcionarios")
    .select("id, matricula, nome, user_id");
  if (error) throw error;

  for (const f of funcs) {
    const email = emailDe(f.matricula);
    const userId = await garantirUsuario(email, f.nome, f.matricula);
    const { error: upErr } = await admin
      .from("funcionarios")
      .update({ user_id: userId })
      .eq("id", f.id);
    if (upErr) throw upErr;
    console.log(`✓ ${f.matricula.padEnd(6)} ${f.nome}  →  ${email}`);
  }

  console.log(`\nConcluído. Senha padrão: "${SENHA_PADRAO}"`);
}

main().catch((e) => {
  console.error("Falha:", e.message ?? e);
  process.exit(1);
});
