import { redirect } from "next/navigation";
import { createClient, usuarioAtual } from "@/lib/supabase/server";

// Raiz: encaminha para o app (se logado) ou para o login.
export default async function Home() {
  const supabase = createClient();
  const user = await usuarioAtual(supabase);
  redirect(user ? "/app" : "/login");
}
