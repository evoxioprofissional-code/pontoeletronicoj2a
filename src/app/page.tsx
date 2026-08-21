import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Raiz: encaminha para o app (se logado) ou para o login.
export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  redirect(user ? "/app" : "/login");
}
