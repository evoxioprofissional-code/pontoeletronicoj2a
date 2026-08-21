"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type NovoState = { ok?: boolean; error?: string };

async function gestorEmpresa() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("funcionarios")
    .select("empresa_id, papel")
    .eq("user_id", user.id)
    .single();
  if (!data || (data.papel !== "rh" && data.papel !== "admin")) return null;
  return data.empresa_id as string;
}

/** A criação de login exige a service_role válida (Latin1 + JWT). */
function serviceRoleOk(): boolean {
  const sk = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (sk.split(".").length !== 3) return false;
  for (let i = 0; i < sk.length; i++) if (sk.charCodeAt(i) > 255) return false;
  return true;
}

export async function criarFuncionario(
  _prev: NovoState,
  formData: FormData,
): Promise<NovoState> {
  const empresaId = await gestorEmpresa();
  if (!empresaId) return { error: "Apenas o administrador pode cadastrar." };

  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");
  const matricula = String(formData.get("matricula") ?? "").trim();
  const cargo = String(formData.get("cargo") ?? "").trim();
  const papel = String(formData.get("papel") ?? "funcionario");
  const horas = Number(formData.get("horas") ?? 8);
  const minutos = Number(formData.get("minutos") ?? 0);
  const carga = Math.max(0, Math.round(horas * 60 + minutos)) || 480;

  if (!nome || !email || !matricula) {
    return { error: "Preencha nome, e-mail e matrícula." };
  }
  if (senha.length < 6) {
    return { error: "A senha deve ter ao menos 6 caracteres." };
  }
  if (!["funcionario", "rh", "admin"].includes(papel)) {
    return { error: "Perfil inválido." };
  }

  if (!serviceRoleOk()) {
    return {
      error:
        "Cadastro indisponível: a chave de serviço não está configurada corretamente na Vercel.",
    };
  }

  const admin = createAdminClient();

  // 1) cria (ou localiza) o usuário de login
  let userId: string | null = null;
  try {
    const criado = await admin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome, matricula },
    });
    if (criado.error) {
      const msg = criado.error.message.toLowerCase();
      if (msg.includes("registered") || msg.includes("already")) {
        return { error: "Já existe um usuário com esse e-mail." };
      }
      return { error: `Falha ao criar login: ${criado.error.message}` };
    }
    userId = criado.data.user.id;
  } catch (e) {
    const m = e instanceof Error ? e.message : "erro";
    return { error: `Falha ao criar login: ${m}` };
  }

  // 2) cria o funcionário vinculado
  const { error } = await admin.from("funcionarios").insert({
    empresa_id: empresaId,
    user_id: userId,
    matricula,
    nome,
    cargo: cargo || null,
    papel,
    carga_horaria_min: carga,
  });
  if (error) {
    // desfaz o login órfão se o funcionário não pôde ser criado
    if (userId) await admin.auth.admin.deleteUser(userId).catch(() => {});
    if (error.code === "23505") {
      return { error: "Matrícula já cadastrada nesta empresa." };
    }
    return { error: `Falha ao salvar funcionário: ${error.message}` };
  }

  revalidatePath("/admin/colaboradores");
  return { ok: true };
}
