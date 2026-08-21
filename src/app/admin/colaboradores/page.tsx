import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NovoColaborador } from "@/components/dash/NovoColaborador";
import { ArrowRight, UserIcon } from "@/components/icons";
import {
  minutosTrabalhados,
  formatarMinutos,
  limitesDoDia,
  type TipoDB,
} from "@/lib/ponto";

export default async function Colaboradores() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: eu } = await supabase
    .from("funcionarios")
    .select("empresa_id")
    .eq("user_id", user!.id)
    .single();

  const { data: funcionarios } = await supabase
    .from("funcionarios")
    .select("id, matricula, nome, cargo, papel, carga_horaria_min")
    .eq("empresa_id", eu!.empresa_id)
    .order("nome");

  const { inicio, fim } = limitesDoDia(new Date());
  const { data: regs } = await supabase
    .from("registros_ponto")
    .select("funcionario_id, tipo, marcado_em")
    .eq("empresa_id", eu!.empresa_id)
    .gte("marcado_em", inicio)
    .lte("marcado_em", fim);

  const porFunc = new Map<string, { tipo: TipoDB; marcado_em: string }[]>();
  for (const r of regs ?? []) {
    const arr = porFunc.get(r.funcionario_id) ?? [];
    arr.push({ tipo: r.tipo as TipoDB, marcado_em: r.marcado_em });
    porFunc.set(r.funcionario_id, arr);
  }

  return (
    <div className="px-5 py-6 lg:px-8">
      <header className="mb-5">
        <h1 className="text-xl font-semibold text-ink">Colaboradores</h1>
        <p className="text-sm text-muted">Horas de hoje por colaborador</p>
      </header>

      <div className="max-w-2xl">
        <NovoColaborador />
      </div>

      <ul className="flex max-w-2xl flex-col gap-2">
        {(funcionarios ?? []).map((f) => {
          const trabalhado = minutosTrabalhados(porFunc.get(f.id) ?? []);
          const carga = f.carga_horaria_min ?? 480;
          const pct = Math.min(100, Math.round((trabalhado / carga) * 100));
          return (
            <li key={f.id}>
              <Link
                href={`/admin/funcionario/${f.id}`}
                className="flex items-center gap-3 rounded-2xl border border-steel-line bg-steel px-4 py-3.5 transition hover:border-amber/40"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-graphite text-amber ring-1 ring-steel-line">
                  <UserIcon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{f.nome}</p>
                  <p className="truncate text-sm text-muted">
                    <span className="font-mono">{f.matricula}</span>
                    {f.cargo ? ` · ${f.cargo}` : ""}
                  </p>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-graphite">
                    <div
                      className="h-full rounded-full bg-amber"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-base font-bold tabular-nums text-ink">
                    {formatarMinutos(trabalhado)}
                  </p>
                  <p className="text-xs text-muted">
                    meta {formatarMinutos(carga)}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-muted" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
