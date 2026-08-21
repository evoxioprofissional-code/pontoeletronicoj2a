"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { criarFuncionario, type NovoState } from "@/app/admin/colaboradores/actions";
import { AlertIcon, CheckIcon } from "@/components/icons";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-amber px-5 py-2.5 text-sm font-semibold text-graphite transition hover:bg-amber-soft disabled:opacity-60"
    >
      {pending ? "Cadastrando…" : "Cadastrar colaborador"}
    </button>
  );
}

const campo =
  "w-full rounded-lg border border-steel-line bg-graphite px-3 py-2 text-ink placeholder:text-muted focus:border-amber focus:outline-none";
const rotulo =
  "text-xs font-semibold uppercase tracking-wider text-muted";

export function NovoColaborador() {
  const [aberto, setAberto] = useState(false);
  const [state, formAction] = useFormState<NovoState, FormData>(
    criarFuncionario,
    {},
  );

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="mb-4 w-full rounded-2xl border border-dashed border-amber/40 bg-amber/5 px-4 py-3 text-sm font-semibold text-amber transition hover:bg-amber/10"
      >
        + Novo colaborador
      </button>
    );
  }

  return (
    <div className="mb-4 rounded-2xl border border-steel-line bg-steel p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-ink">Novo colaborador</h2>
        <button
          onClick={() => setAberto(false)}
          className="text-sm text-muted hover:text-ink"
        >
          Fechar
        </button>
      </div>

      <form action={formAction} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className={rotulo}>Nome completo</span>
          <input name="nome" required className={campo} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className={rotulo}>Matrícula</span>
            <input name="matricula" required className={`${campo} font-mono`} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={rotulo}>Cargo</span>
            <input name="cargo" className={campo} />
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className={rotulo}>E-mail (login)</span>
          <input name="email" type="email" required className={campo} />
        </label>

        <label className="flex flex-col gap-1">
          <span className={rotulo}>Senha inicial</span>
          <input
            name="senha"
            type="text"
            required
            minLength={6}
            placeholder="mín. 6 caracteres"
            className={campo}
          />
        </label>

        <div className="grid grid-cols-3 gap-3">
          <label className="col-span-1 flex flex-col gap-1">
            <span className={rotulo}>Perfil</span>
            <select name="papel" defaultValue="funcionario" className={campo}>
              <option value="funcionario">Funcionário</option>
              <option value="rh">RH</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={rotulo}>Horas/dia</span>
            <input
              name="horas"
              type="number"
              min={0}
              max={24}
              defaultValue={8}
              className={`${campo} font-mono`}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={rotulo}>Minutos</span>
            <input
              name="minutos"
              type="number"
              min={0}
              max={59}
              defaultValue={0}
              className={`${campo} font-mono`}
            />
          </label>
        </div>

        {state.error && (
          <p className="flex items-center gap-2 text-sm text-danger">
            <AlertIcon className="h-4 w-4 shrink-0" /> {state.error}
          </p>
        )}
        {state.ok && (
          <p className="flex items-center gap-2 text-sm text-signal">
            <CheckIcon className="h-4 w-4" /> Colaborador cadastrado!
          </p>
        )}

        <div className="flex justify-end">
          <Submit />
        </div>
      </form>
    </div>
  );
}
