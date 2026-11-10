import { redirect } from "next/navigation";
import { createClient, usuarioAtual } from "@/lib/supabase/server";
import { AdminShell } from "@/components/dash/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const user = await usuarioAtual(supabase);
  if (!user) redirect("/login");
  const { data: eu } = await supabase
    .from("funcionarios")
    .select("papel")
    .eq("user_id", user.id)
    .single();
  if (!eu || (eu.papel !== "rh" && eu.papel !== "admin")) redirect("/app");

  return <AdminShell>{children}</AdminShell>;
}
