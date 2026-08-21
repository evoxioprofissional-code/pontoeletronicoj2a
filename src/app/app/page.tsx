import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LiveClock, DataExtenso } from "@/components/LiveClock";
import { PontoCliente } from "@/components/PontoCliente";
import { BottomNav } from "@/components/BottomNav";
import { StatusBadge } from "@/components/ui";
import {
  PunchIcon,
  MenuIcon,
  ChartIcon,
  GearIcon,
  ShieldIcon,
  CalendarIcon,
} from "@/components/icons";
import {
  proximoTipo,
  statusDe,
  minutosTrabalhados,
  formatarMinutos,
  limitesDoDia,
  rotuloTipo,
  type TipoDB,
} from "@/lib/ponto";

const HORA_FMT = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

function Atalho({
  href,
  titulo,
  sub,
  children,
}: {
  href: string;
  titulo: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-2 rounded-2xl border border-steel-line bg-steel p-4 transition hover:border-amber/40"
    >
      <span className="text-amber">{children}</span>
      <span>
        <span className="block font-semibold text-ink">{titulo}</span>
        <span className="block text-xs text-muted">{sub}</span>
      </span>
    </Link>
  );
}

export default async function AppHome() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: func } = await supabase
    .from("funcionarios")
    .select("id, matricula, nome, cargo, papel, carga_horaria_min, empresa_id")
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

  const { data: cerca } = await supabase
    .from("cercas")
    .select("nome, latitude, longitude, raio_metros")
    .eq("empresa_id", func.empresa_id)
    .eq("ativo", true)
    .limit(1)
    .maybeSingle();

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

  const admin = createAdminClient();
  const { data: bio } = await admin
    .from("biometria_facial")
    .select("funcionario_id")
    .eq("funcionario_id", func.id)
    .maybeSingle();
  const temFace = Boolean(bio);

  const primeiroNome = func.nome.split(" ")[0];

  return (
    <div className="min-h-screen bg-graphite">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-steel-line bg-graphite/95 px-4 py-3 backdrop-blur">
        <Link
          href="/app/perfil"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink"
          aria-label="Menu"
        >
          <MenuIcon className="h-6 w-6" />
        </Link>
        <span className="font-mono text-lg font-bold text-ink">
          j2a<span className="text-amber">ponto</span>
        </span>
        <div className="h-9 w-9" />
      </header>

      <div className="mx-auto max-w-md px-5 pb-28 pt-4">
        {/* Data + saudação */}
        <div className="mb-4">
          <p className="flex items-center gap-1.5 text-sm text-muted">
            <CalendarIcon className="h-4 w-4" />
            <DataExtenso />
          </p>
          <h1 className="mt-1 text-2xl font-bold text-ink">
            Olá, {primeiroNome}!
          </h1>
          <p className="text-sm text-muted">
            Bem-vindo ao j2aponto, seu sistema de ponto
          </p>
        </div>

        {/* Card do relógio + bater ponto */}
        <section className="rounded-3xl border border-steel-line bg-steel p-5">
          <div className="mb-4 flex justify-center">
            <StatusBadge status={status} />
          </div>
          <LiveClock mostrarData={false} />
          <div className="mt-5">
            <PontoCliente
              cerca={cerca ?? null}
              temFace={temFace}
              proximoTipo={prox}
            />
          </div>
          <p className="mt-4 text-center text-xs text-muted">
            Horas hoje{" "}
            <span className="font-mono text-ink">
              {formatarMinutos(trabalhado)}
            </span>{" "}
            · meta {formatarMinutos(carga)}
          </p>
        </section>

        {/* Pontos de hoje */}
        <section className="mt-4 rounded-2xl border border-steel-line bg-steel p-4">
          <p className="font-semibold text-ink">Pontos de hoje</p>
          <p className="mb-3 text-xs text-muted">Seus últimos pontos batidos</p>
          {marcacoes.length === 0 ? (
            <p className="py-3 text-center text-sm text-muted">
              Nenhuma marcação hoje ainda.
            </p>
          ) : (
            <ol className="flex flex-col gap-2">
              {marcacoes.map((m, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-xl bg-graphite px-3 py-2.5 ring-1 ring-steel-line"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-steel text-amber">
                    <PunchIcon type={rotuloTipo(m.tipo) as never} className="h-4 w-4" />
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

        {/* Atalhos */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Atalho
            href="/app/registros"
            titulo="Meus registros"
            sub="Suas marcações"
          >
            <ChartIcon className="h-6 w-6" />
          </Atalho>
          <Atalho
            href="/app/perfil"
            titulo="Configurações"
            sub="Configure seu app"
          >
            <GearIcon className="h-6 w-6" />
          </Atalho>
        </div>

        {gestor && (
          <Link
            href="/admin"
            className="mt-3 flex items-center gap-3 rounded-2xl border border-amber/30 bg-amber/5 p-4 transition hover:bg-amber/10"
          >
            <ShieldIcon className="h-6 w-6 text-amber" />
            <span>
              <span className="block font-semibold text-ink">
                Painel do administrador
              </span>
              <span className="block text-xs text-muted">
                Métricas, colaboradores e ajustes
              </span>
            </span>
          </Link>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
