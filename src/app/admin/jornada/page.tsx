import Link from "next/link";
import { redirect } from "next/navigation";
import { CabecalhoPagina } from "@/components/dash/AdminShell";
import { AvisoMigracao } from "@/components/dash/AvisoMigracao";
import { SecaoEquipes, SecaoFeriados, SecaoTurnos } from "@/components/dash/Jornada";
import { contextoGestor } from "@/lib/relatorios";
import { escalaValida, type Turno } from "@/lib/turnos";
import { dataLocal } from "@/lib/ponto";
import { ArrowLeft, ArrowRight } from "@/components/icons";

export default async function JornadaPage({
  searchParams,
}: {
  searchParams: { ano?: string };
}) {
  const ctx = await contextoGestor();
  if (!ctx) redirect("/app");
  const anoAtual = Number(dataLocal(new Date()).slice(0, 4));
  const ano = Math.min(anoAtual + 1, Math.max(2020, Number(searchParams.ano) || anoAtual));

  const [t, e, f, p] = await Promise.all([
    ctx.supabase
      .from("turnos")
      .select("id, nome, escala, tolerancia_min")
      .eq("empresa_id", ctx.empresaId)
      .order("nome"),
    ctx.supabase.from("equipes").select("id, nome").eq("empresa_id", ctx.empresaId).order("nome"),
    ctx.supabase
      .from("feriados")
      .select("id, data, nome")
      .eq("empresa_id", ctx.empresaId)
      .gte("data", `${ano}-01-01`)
      .lte("data", `${ano}-12-31`)
      .order("data"),
    ctx.supabase
      .from("funcionarios")
      .select("turno_id, equipe_id")
      .eq("empresa_id", ctx.empresaId)
      .eq("ativo", true),
  ]);

  if (t.error || e.error || f.error || p.error) {
    return (
      <>
        <CabecalhoPagina titulo="Turnos e feriados" />
        <AvisoMigracao />
      </>
    );
  }

  const turnos: Turno[] = (t.data ?? []).flatMap((x) => {
    const escala = escalaValida(x.escala);
    return escala ? [{ id: x.id, nome: x.nome, escala, tolerancia_min: x.tolerancia_min }] : [];
  });
  const porTurno: Record<string, number> = {};
  const porEquipe: Record<string, number> = {};
  for (const x of p.data ?? []) {
    if (x.turno_id) porTurno[x.turno_id] = (porTurno[x.turno_id] ?? 0) + 1;
    if (x.equipe_id) porEquipe[x.equipe_id] = (porEquipe[x.equipe_id] ?? 0) + 1;
  }

  const seta =
    "flex h-9 w-9 items-center justify-center toque rounded-full bg-surface text-ink shadow-card hover:bg-sunken";

  return (
    <>
      <CabecalhoPagina
        titulo="Turnos e feriados"
        descricao="A jornada de cada pessoa, os setores da fábrica e os dias sem expediente."
      />
      <div className="flex flex-col gap-8">
        <SecaoTurnos turnos={turnos} pessoasPorTurno={porTurno} />
        <div className="grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <SecaoEquipes equipes={e.data ?? []} pessoasPorEquipe={porEquipe} />
          <div>
            <div className="mb-2 flex justify-end gap-2">
              <Link href={`/admin/jornada?ano=${ano - 1}`} className={seta} aria-label="Ano anterior">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              {ano < anoAtual + 1 && (
                <Link href={`/admin/jornada?ano=${ano + 1}`} className={seta} aria-label="Próximo ano">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
            <SecaoFeriados feriados={f.data ?? []} ano={ano} />
          </div>
        </div>
      </div>
    </>
  );
}
