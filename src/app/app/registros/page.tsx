import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, usuarioAtual } from "@/lib/supabase/server";
import { BottomNav } from "@/components/BottomNav";
import { ArrowLeft, PunchIcon } from "@/components/icons";
import {
  minutosTrabalhados,
  formatarMinutos,
  rotuloTipo,
  limitesDoMes,
  dataLocal,
  type TipoDB,
} from "@/lib/ponto";

const DIA_FMT = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  weekday: "long",
  day: "2-digit",
  month: "long",
});
const HORA_FMT = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function Registros() {
  const supabase = createClient();
  const user = await usuarioAtual(supabase);
  if (!user) redirect("/login");

  const { data: func } = await supabase
    .from("funcionarios")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!func) redirect("/app");

  const { inicio } = limitesDoMes(new Date());
  const { data: regs } = await supabase
    .from("registros_ponto")
    .select("tipo, marcado_em")
    .eq("funcionario_id", func.id)
    .gte("marcado_em", inicio)
    .order("marcado_em", { ascending: false });

  const marcacoes = (regs ?? []) as { tipo: TipoDB; marcado_em: string }[];

  // Agrupa por dia
  const dias = new Map<string, { tipo: TipoDB; marcado_em: string }[]>();
  for (const m of marcacoes) {
    const key = dataLocal(new Date(m.marcado_em));
    const arr = dias.get(key) ?? [];
    arr.push(m);
    dias.set(key, arr);
  }

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
        <h1 className="text-lg font-semibold text-ink">Meus registros</h1>
      </header>

      <div className="mx-auto max-w-md px-5 pb-28 pt-4">
        {dias.size === 0 ? (
          <p className="py-16 text-center text-sm text-muted">
            Nenhuma marcação neste mês ainda.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {[...dias.entries()].map(([key, marc]) => {
              const trab = minutosTrabalhados(marc);
              const data = new Date(marc[0].marcado_em);
              const ordenadas = [...marc].sort(
                (a, b) => +new Date(a.marcado_em) - +new Date(b.marcado_em),
              );
              return (
                <section
                  key={key}
                  className="rounded-2xl border border-steel-line bg-steel p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold capitalize text-ink">
                      {DIA_FMT.format(data)}
                    </p>
                    <span className="font-mono text-sm text-amber">
                      {formatarMinutos(trab)}
                    </span>
                  </div>
                  <ol className="flex flex-col gap-2">
                    {ordenadas.map((m, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-graphite text-amber ring-1 ring-steel-line">
                          <PunchIcon
                            type={rotuloTipo(m.tipo) as never}
                            className="h-4 w-4"
                          />
                        </div>
                        <span className="flex-1 text-sm text-ink">
                          {rotuloTipo(m.tipo)}
                        </span>
                        <span className="font-mono text-base tabular-nums text-ink">
                          {HORA_FMT.format(new Date(m.marcado_em))}
                        </span>
                      </li>
                    ))}
                  </ol>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
