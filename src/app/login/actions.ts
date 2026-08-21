"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { matriculaParaEmail } from "@/lib/auth";

export type LoginState = { error?: string };

export async function entrar(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const matricula = String(formData.get("matricula") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  if (!matricula || !senha) {
    return { error: "Informe matrícula e senha." };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: matriculaParaEmail(matricula),
    password: senha,
  });

  if (error) {
    return { error: "Matrícula ou senha inválidos." };
  }

  // redirect() lança internamente — deve ficar fora do try/catch.
  redirect("/app");
}
