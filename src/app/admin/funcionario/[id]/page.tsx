import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, usuarioAtual } from "@/lib/supabase/server";
import { ArrowLeft } from "@/components/icons";
import {
  minutosTrabalhados,
  formatarMinutos,
  limitesDoDia,
  dataLocal,
  horaLocal,
  rotuloTipo,
  CICLO,
  type TipoDB,
} from "@/lib/ponto";
import {
  definirCarga,
  ajustarMarcacao,
  adicionarMarcacao,
  excluirMarcacao,
} from "../../actions";

const ymdLocal = dataLocal;
function hmLocal(iso: string): string {
  const d = new Date(iso);
  return horaLocal(d);
}

const DATA_FMT = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  weekday: "long",
  day: "2-digit",
  month: "long",
});

export default async function AdminFuncionario({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { d?: string };
}) {
  const supabase = createClient();
  const user = await usuarioAtual(supabase);
  if (!user) redirect("/login");

  const { data: eu } = await supabase
    .from("funcionarios")
    .select("papel, empresa_id")
    .eq("user_id", user.id)
    .single();
  if (!eu || (eu.papel !== "rh" && eu.papel !== "admin")) redirect("/app");

  const { data: func } = await supabase
    .from("funcionarios")
    .select("id, matricula, nome, cargo, carga_horaria_min, empresa_id")
    .eq("id", params.id)
    .single();
  if (!func || func.empresa_id !== eu.empresa_id) redirect("/admin");

  // Dia selecionado (offset em relação a hoje; 0 = hoje, -1 = ontem …)
  const offset = Math.min(0, parseInt(searchParams.d ?? "0", 10) || 0);
  const selData = new Date();
  selData.setDate(selData.getDate() + offset);
  const dia = ymdLocal(selData);
  const { inicio, fim } = limitesDoDia(selData);

  const { data: regs } = await supabase
    .from("registros_ponto")
    .select("id, tipo, marcado_em, metodo_verificacao, ajustado")
    .eq("funcionario_id", func.id)
    .gte("marcado_em", inicio)
    .lte("marcado_em", fim)
    .order("marcado_em");

  const marcacoes = (regs ?? []) as {
    id: string;
    tipo: TipoDB;
    marcado_em: string;
    metodo_verificacao: string;
    ajustado: boolean;
  }[];
  const trabalhado = minutosTrabalhados(marcacoes);
  const carga = func.carga_horaria_min ?? 480;
  const cargaH = Math.floor(carga / 60);
  const cargaM = carga % 60;

  const rotuloDia =
    offset === 0 ? "Hoje" : offset === -1 ? "Ontem" : DATA_FMT.format(selData);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-5 py-8">
      <header className="flex items-center gap-3">
        <Link
          href="/admin/colaboradores"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-steel text-ink ring-1 ring-steel-line"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-ink">{func.nome}</h1>
          <p className="text-sm text-muted">
            <span className="font-mono">{func.matricula}</span>
            {func.cargo ? ` · ${func.cargo}` : ""}
          </p>
        </div>
      </header>

      {/* Carga horária */}
      <section className="rounded-2xl border border-steel-line bg-steel p-5">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          Carga horária diária
        </p>
        <form action={definirCarga} className="flex items-end gap-2">
          <input type="hidden" name="funcionarioId" value={func.id} />
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">Horas</span>
            <input
              type="number"
              name="horas"
              min={0}
              max={24}
              defaultValue={cargaH}
              className="w-20 rounded-lg border border-steel-line bg-graphite px-3 py-2 font-mono text-ink focus:border-amber focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">Minutos</span>
            <input
              type="number"
              name="minutos"
              min={0}
              max={59}
              defaultValue={cargaM}
              className="w-20 rounded-lg border border-steel-line bg-graphite px-3 py-2 font-mono text-ink focus:border-amber focus:outline-none"
            />
          </label>
          <button
            type="submit"
            className="ml-auto rounded-xl bg-amber px-4 py-2.5 text-sm font-semibold text-graphite transition hover:bg-amber-soft"
          >
            Salvar meta
          </button>
        </form>
      </section>

      {/* Navegação de dia + resumo */}
      <section className="rounded-2xl border border-steel-line bg-steel p-5">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href={`/admin/funcionario/${func.id}?d=${offset - 1}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-graphite text-ink ring-1 ring-steel-line"
            aria-label="Dia anterior"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <p className="font-semibold capitalize text-ink">{rotuloDia}</p>
          <Link
            href={`/admin/funcionario/${func.id}?d=${Math.min(0, offset + 1)}`}
            aria-disabled={offset === 0}
            className={`flex h-9 w-9 items-center justify-center rounded-lg bg-graphite text-ink ring-1 ring-steel-line ${
              offset === 0 ? "pointer-events-none opacity-30" : ""
            }`}
            aria-label="Próximo dia"
          >
            <ArrowLeft className="h-4 w-4 rotate-180" />
          </Link>
        </div>
        <div className="flex items-end justify-between">
          <p className="font-mono text-3xl font-bold tabular-nums text-amber">
            {formatarMinutos(trabalhado)}
          </p>
          <p className="pb-1 text-sm text-muted">meta {formatarMinutos(carga)}</p>
        </div>
      </section>

      {/* Marcações do dia */}
      <section>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          Marcações — ajustar horário
        </p>
        <div className="flex flex-col gap-2">
          {marcacoes.length === 0 && (
            <div className="rounded-2xl border border-dashed border-steel-line bg-steel/50 px-4 py-5 text-center text-sm text-muted">
              Nenhuma marcação neste dia.
            </div>
          )}
          {marcacoes.map((m) => (
            <div
              key={m.id}
              className="rounded-2xl border border-steel-line bg-steel p-4"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="font-semibold text-ink">
                  {rotuloTipo(m.tipo)}
                </span>
                {m.metodo_verificacao === "manual" && (
                  <span className="rounded-md bg-graphite px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted ring-1 ring-steel-line">
                    Manual
                  </span>
                )}
                {m.ajustado && (
                  <span className="rounded-md bg-amber/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber ring-1 ring-amber/30">
                    Ajustado
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <form
                  action={ajustarMarcacao}
                  className="flex flex-1 flex-wrap items-end gap-2"
                >
                  <input type="hidden" name="registroId" value={m.id} />
                  <input type="hidden" name="dia" value={dia} />
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-muted">Horário</span>
                    <input
                      type="time"
                      name="hora"
                      step={60}
                      defaultValue={hmLocal(m.marcado_em)}
                      className="rounded-lg border border-steel-line bg-graphite px-3 py-2 font-mono text-ink focus:border-amber focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-1 flex-col gap-1">
                    <span className="text-xs text-muted">Motivo</span>
                    <input
                      type="text"
                      name="motivo"
                      placeholder="Ex.: correção de esquecimento"
                      className="w-full min-w-[140px] rounded-lg border border-steel-line bg-graphite px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-amber focus:outline-none"
                    />
                  </label>
                  <button
                    type="submit"
                    className="rounded-xl bg-amber px-4 py-2.5 text-sm font-semibold text-graphite transition hover:bg-amber-soft"
                  >
                    Salvar
                  </button>
                </form>
                <form action={excluirMarcacao}>
                  <input type="hidden" name="registroId" value={m.id} />
                  <button
                    type="submit"
                    className="rounded-xl bg-transparent px-3 py-2.5 text-sm font-semibold text-danger ring-1 ring-danger/40 transition hover:bg-danger/10"
                  >
                    Excluir
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Adicionar marcação */}
      <section className="rounded-2xl border border-steel-line bg-steel p-5">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          Adicionar marcação
        </p>
        <form action={adicionarMarcacao} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="funcionarioId" value={func.id} />
          <input type="hidden" name="dia" value={dia} />
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">Tipo</span>
            <select
              name="tipo"
              defaultValue="entrada"
              className="rounded-lg border border-steel-line bg-graphite px-3 py-2 text-ink focus:border-amber focus:outline-none"
            >
              {CICLO.map((t) => (
                <option key={t} value={t}>
                  {rotuloTipo(t)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">Horário</span>
            <input
              type="time"
              name="hora"
              step={60}
              className="rounded-lg border border-steel-line bg-graphite px-3 py-2 font-mono text-ink focus:border-amber focus:outline-none"
              required
            />
          </label>
          <button
            type="submit"
            className="ml-auto rounded-xl bg-steel px-4 py-2.5 text-sm font-semibold text-amber ring-1 ring-amber/40 transition hover:bg-steel-line"
          >
            Adicionar
          </button>
        </form>
      </section>
    </div>
  );
}
