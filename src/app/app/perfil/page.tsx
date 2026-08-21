import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/BottomNav";
import { ArrowLeft, LogoutIcon, ShieldIcon, PinIcon } from "@/components/icons";
import { sair } from "../actions";

function Linha({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-center justify-between border-b border-steel-line px-4 py-3.5 last:border-b-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="max-w-[60%] truncate text-right font-medium text-ink">
        {valor}
      </span>
    </div>
  );
}

export default async function Perfil() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: func } = await supabase
    .from("funcionarios")
    .select(
      "id, matricula, nome, cargo, papel, empresa_id, empresas(razao_social, nome_fantasia)",
    )
    .eq("user_id", user.id)
    .single();
  if (!func) redirect("/app");

  const empresa = Array.isArray(func.empresas)
    ? func.empresas[0]
    : func.empresas;

  const { data: cerca } = await supabase
    .from("cercas")
    .select("nome, endereco, raio_metros")
    .eq("empresa_id", func.empresa_id)
    .eq("ativo", true)
    .limit(1)
    .maybeSingle();

  const { data: bio } = await supabase
    .from("biometria_facial")
    .select("funcionario_id")
    .eq("funcionario_id", func.id)
    .maybeSingle();
  const temFace = Boolean(bio);

  const iniciais = func.nome
    .split(" ")
    .slice(0, 2)
    .map((n: string) => n[0])
    .join("");

  return (
    <div className="min-h-screen bg-graphite">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-steel-line bg-graphite/95 px-4 py-3 backdrop-blur">
        <Link
          href="/app"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-steel text-ink ring-1 ring-steel-line"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-semibold text-ink">Configurações</h1>
      </header>

      <div className="mx-auto max-w-md px-5 pb-28 pt-4">
        {/* Identidade */}
        <section className="flex items-center gap-4 rounded-2xl border border-steel-line bg-steel p-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-graphite font-mono text-2xl font-bold text-amber ring-1 ring-steel-line">
            {iniciais}
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-ink">
              {func.nome}
            </p>
            <p className="truncate text-sm text-muted">{func.cargo}</p>
            <p className="mt-0.5 font-mono text-sm text-amber">
              Matrícula {func.matricula}
            </p>
          </div>
        </section>

        {/* Dados */}
        <p className="mb-2 mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          Dados
        </p>
        <div className="overflow-hidden rounded-2xl border border-steel-line bg-steel">
          <Linha label="Empresa" valor={empresa?.nome_fantasia ?? empresa?.razao_social ?? "—"} />
          <Linha label="Perfil" valor={func.papel} />
          <Linha
            label="Reconhecimento facial"
            valor={temFace ? "Cadastrado" : "Não cadastrado"}
          />
        </div>

        {/* Cerca */}
        {cerca && (
          <>
            <p className="mb-2 mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              Local de trabalho
            </p>
            <div className="rounded-2xl border border-steel-line bg-steel p-4">
              <div className="mb-1 flex items-center gap-2 text-amber">
                <PinIcon className="h-5 w-5" />
                <span className="text-sm font-semibold">{cerca.nome}</span>
              </div>
              <p className="text-sm text-muted">{cerca.endereco}</p>
              <div className="mt-3 flex items-center justify-between border-t border-steel-line pt-3">
                <span className="text-sm text-muted">Raio permitido</span>
                <span className="font-mono text-ink">{cerca.raio_metros} m</span>
              </div>
            </div>
          </>
        )}

        {(func.papel === "rh" || func.papel === "admin") && (
          <Link
            href="/admin"
            className="mt-6 flex items-center gap-3 rounded-2xl border border-amber/30 bg-amber/5 p-4 transition hover:bg-amber/10"
          >
            <ShieldIcon className="h-6 w-6 text-amber" />
            <span className="font-semibold text-ink">
              Painel do administrador
            </span>
          </Link>
        )}

        <form action={sair} className="mt-6">
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-transparent px-5 py-3.5 text-sm font-semibold text-danger ring-1 ring-danger/40 transition hover:bg-danger/10"
          >
            <LogoutIcon className="h-5 w-5" />
            Sair da conta
          </button>
        </form>
      </div>

      <BottomNav />
    </div>
  );
}
