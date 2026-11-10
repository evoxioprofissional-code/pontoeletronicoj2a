import { redirect } from "next/navigation";
import { createClient, usuarioAtual } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dash/Sidebar";

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

  return (
    <div className="flex min-h-screen bg-graphite text-ink">
      <Sidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
