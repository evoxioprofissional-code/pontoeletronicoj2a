"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { salvarTurno, type Estado } from "@/app/admin/jornada/actions";
import { Aviso, Campo, botao } from "@/components/ui";
import { formatarMinutos } from "@/lib/ponto";
import {
  NOMES_SEMANA,
  jornadaDoDia,
  type DiaTurno,
  type Escala,
  type Turno,
} from "@/lib/turnos";

const PADRAO: DiaTurno = { entrada: "08:00", saida: "17:00", intervalo: 60 };
// Segunda primeiro: é como as pessoas pensam a semana.
const ORDEM = [1, 2, 3, 4, 5, 6, 0];

function Salvar({ editando }: { editando: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={botao("primario")}>
      {pending ? "Salvando…" : editando ? "Salvar turno" : "Criar turno"}
    </button>
  );
}

export function FormTurno({
  turno,
  onFechar,
}: {
  turno?: Turno;
  onFechar: () => void;
}) {
  const [state, action] = useFormState<Estado, FormData>(salvarTurno, {});
  const [escala, setEscala] = useState<Escala>(
    turno?.escala ?? [null, PADRAO, PADRAO, PADRAO, PADRAO, PADRAO, null],
  );

  useEffect(() => {
    if (state.ok) onFechar();
  }, [state, onFechar]);

  const mudar = (i: number, d: Partial<DiaTurno> | null) =>
    setEscala((e) => {
      const n = [...e];
      n[i] = d === null ? null : { ...(n[i] ?? PADRAO), ...d };
      return n;
    });

  const semanal = escala.reduce((a, d) => a + jornadaDoDia(d), 0);

  return (
    <form action={action} className="flex flex-col gap-5">
      {turno && <input type="hidden" name="id" value={turno.id} />}
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
        <Campo rotulo="Nome do turno">
          <input
            name="nome"
            required
            maxLength={80}
            defaultValue={turno?.nome ?? ""}
            placeholder="Ex.: Produção 08h às 18h"
            className="campo"
          />
        </Campo>
        <Campo rotulo="Tolerância de atraso" dica="Minutos aceitos sem contar atraso.">
          <div className="flex items-center gap-2">
            <input
              name="tolerancia"
              type="number"
              min={0}
              max={60}
              defaultValue={turno?.tolerancia_min ?? 10}
              className="campo num w-20"
            />
            <span className="text-sm text-ink-3">min</span>
          </div>
        </Campo>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink-2">Dias e horários</legend>
        <div className="overflow-hidden rounded-2xl bg-sunken/60">
          {ORDEM.map((i) => {
            const d = escala[i];
            return (
              <div
                key={i}
                className={`flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-3 py-2.5 last:border-b-0 sm:px-4 ${
                  d ? "bg-surface" : "bg-sunken/50"
                }`}
              >
                <label className="flex w-28 items-center gap-2.5">
                  <input
                    type="checkbox"
                    name={`d${i}_ativo`}
                    checked={Boolean(d)}
                    onChange={(e) => mudar(i, e.target.checked ? {} : null)}
                    className="h-4 w-4"
                  />
                  <span className={`font-medium ${d ? "text-ink" : "text-ink-3"}`}>
                    {NOMES_SEMANA[i]}
                  </span>
                </label>
                {d ? (
                  <>
                    <label className="flex items-center gap-1.5 text-sm text-ink-3">
                      Entra
                      <input
                        type="time"
                        name={`d${i}_entrada`}
                        value={d.entrada}
                        onChange={(e) => mudar(i, { entrada: e.target.value })}
                        className="campo num w-[7.25rem]"
                      />
                    </label>
                    <label className="flex items-center gap-1.5 text-sm text-ink-3">
                      Sai
                      <input
                        type="time"
                        name={`d${i}_saida`}
                        value={d.saida}
                        onChange={(e) => mudar(i, { saida: e.target.value })}
                        className="campo num w-[7.25rem]"
                      />
                    </label>
                    <label className="flex items-center gap-1.5 text-sm text-ink-3">
                      Intervalo
                      <input
                        type="number"
                        name={`d${i}_intervalo`}
                        min={0}
                        max={600}
                        value={d.intervalo}
                        onChange={(e) => mudar(i, { intervalo: Number(e.target.value) })}
                        className="campo num w-20"
                      />
                      min
                    </label>
                    <span className="num ml-auto text-sm font-medium text-ink">
                      {formatarMinutos(jornadaDoDia(d))}
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-ink-3">Folga</span>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-sm text-ink-3">
          Jornada semanal:{" "}
          <span className="num font-semibold text-ink">{formatarMinutos(semanal)}</span>
          {semanal > 44 * 60 && (
            <span className="ml-2 text-warn">acima de 44h semanais (limite da CLT)</span>
          )}
        </p>
      </fieldset>

      {state.error && <Aviso tom="erro">{state.error}</Aviso>}

      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onFechar} className={botao("secundario")}>
          Cancelar
        </button>
        <Salvar editando={Boolean(turno)} />
      </div>
    </form>
  );
}
