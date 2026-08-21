import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LiveClock } from "@/components/LiveClock";
import { PontoCliente } from "@/components/PontoCliente";
import { StatusBadge } from "@/components/ui";
import { PunchIcon, LogoutIcon, ShieldIcon } from "@/components/icons";
import {
  proximoTipo,
  statusDe,
  minutosTrabalhados,
  formatarMinutos,
  limitesDoDia,
  rotuloTipo,
  type TipoDB,
} from "@/lib/ponto";
import { sair } from "./actions";

const HORA_FMT = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AppHome() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: func } = await supabase
    .from("funcionarios")
    .select(
      "id, matricula, nome, cargo, papel, carga_horaria_min, empresa_id, empresas(razao_social, nome_fantasia)",
    )
    .eq("user_id", user.id)
    .single();

  if (!func) {
    return (
      <main className="stage-bg flex min-h-screen items-center justify-center px-6 text-center">
        <p className="text-muted">
          Sua conta não está vinculada a um funcionário. Procure o RH.
        </p>
      </main>
    );
  }

  const gestor = func.papel === "rh" || func.papel === "admin";

  // Cerca ativa da empresa
  const { data: cerca } = await supabase
    .from("cercas")
    .select("nome, latitude, longitude, raio_metros")
    .eq("empresa_id", func.empresa_id)
    .eq("ativo", true)
    .limit(1)
    .maybeSingle();

  // Marcações de hoje
  const { inicio, fim } = limitesDoDia(new Date());
  const { data: hoje } = await supabase
    .from("registros_ponto")
    .select("tipo, marcado_em")
    .eq("funcionario_id", func.id)
    .gte("marcado_em", inicio)
    .lte("marcado_em", fim)
    .order("marcado_em");

  const marcacoes = (hoje ?? []) as { tipo: TipoDB; marcado_em: string }[];
  const tipos = marcacoes.map((m) => m.tipo);
  const status = statusDe(tipos);
  const prox = proximoTipo(tipos);
  const trabalhado = minutosTrabalhados(marcacoes);
  const carga = func.carga_horaria_min ?? 480;
  const progresso = Math.min(100, Math.round((trabalhado / carga) * 100));
  const ultimo = marcacoes[marcacoes.length - 1] ?? null;

  // Rosto cadastrado?
  const admin = createAdminClient();
  const { data: bio } = await admin
    .from("biometria_facial")
    .select("funcionario_id")
    .eq("funcionario_id", func.id)
    .maybeSingle();
  const temFace = Boolean(bio);

  const primeiroNome = func.nome.split(" ")[0];

  return (
    <main className="stage-bg mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-5 py-8">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">Olá,</p>
          <p className="text-lg font-semibold text-ink">{primeiroNome}</p>
        </div>
        <StatusBadge status={status} />
      </header>

      <section className="rounded-3xl border border-steel-line bg-steel px-5 py-6">
        <LiveClock />
      </section>

      <PontoCliente cerca={cerca ?? null} temFace={temFace} proximoTipo={prox} />

      {/* Horas do dia */}
      <section className="rounded-2xl border border-steel-line bg-steel p-5">
        <div className="mb-2 flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              Horas hoje
            </p>
            <p className="font-mono text-3xl font-bold tabular-nums text-amber">
              {formatarMinutos(trabalhado)}
            </p>
          </div>
          <p className="pb-1 text-sm text-muted">
            meta {formatarMinutos(carga)}
          </p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-graphite">
          <div
            className="h-full rounded-full bg-amber transition-all"
            style={{ width: `${progresso}%` }}
          />
        </div>
      </section>

      {/* Marcações de hoje */}
      <section>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          Marcações de hoje
        </p>
        {marcacoes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-steel-line bg-steel/50 px-4 py-5 text-center text-sm text-muted">
            Nenhuma marcação hoje ainda.
          </div>
        ) : (
          <ol className="overflow-hidden rounded-2xl border border-steel-line">
            {marcacoes.map((m, i) => (
              <li
                key={i}
                className="flex items-center gap-3 border-b border-steel-line bg-steel px-4 py-3 last:border-b-0"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-graphite text-amber ring-1 ring-steel-line">
                  <PunchIcon
                    type={rotuloTipo(m.tipo) as never}
                    className="h-5 w-5"
                  />
                </div>
                <span className="flex-1 text-sm font-medium text-ink">
                  {rotuloTipo(m.tipo)}
                </span>
                <span className="font-mono text-base tabular-nums text-ink">
                  {HORA_FMT.format(new Date(m.marcado_em))}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <div className="mt-auto flex flex-col gap-3 pt-4">
        {gestor && (
          <Link
            href="/admin"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-steel px-5 py-3.5 text-sm font-semibold text-amber ring-1 ring-amber/30 transition hover:bg-steel-line"
          >
            <ShieldIcon className="h-5 w-5" />
            Painel do administrador
          </Link>
        )}
        <form action={sair}>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-transparent px-5 py-3.5 text-sm font-semibold text-danger ring-1 ring-danger/40 transition hover:bg-danger/10"
          >
            <LogoutIcon className="h-5 w-5" />
            Sair da conta
          </button>
        </form>
      </div>
    </main>
  );
}
