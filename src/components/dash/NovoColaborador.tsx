"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  criarFuncionario,
  type NovoState,
} from "@/app/admin/colaboradores/actions";
import { Aviso, Campo, Cartao, botao } from "@/components/ui";
import { PlusIcon } from "@/components/icons";

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={botao("primario")}>
      {pending ? "Cadastrando…" : "Cadastrar colaborador"}
    </button>
  );
}

export function NovoColaborador({ aberto: abertoInicial = false }: { aberto?: boolean }) {
  const [aberto, setAberto] = useState(abertoInicial);
  const [state, formAction] = useFormState<NovoState, FormData>(
    criarFuncionario,
    {},
  );

  if (!aberto) {
    return (
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setAberto(true)}
          className={botao("primario", "md", "w-full sm:w-auto")}
        >
          <PlusIcon className="h-[1.125rem] w-[1.125rem]" />
          Novo colaborador
        </button>
      </div>
    );
  }

  return (
    <Cartao className="mb-5 p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">Novo colaborador</h2>
          <p className="mt-0.5 text-sm text-ink-3">
            Cria o cadastro e o login. Passe o e-mail e a senha para a pessoa.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className={botao("texto", "md", "!min-h-0 !px-0 shrink-0")}
        >
          Fechar
        </button>
      </div>

      <form action={formAction} className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Nome completo" className="sm:col-span-2">
          <input name="nome" required autoComplete="off" className="campo" />
        </Campo>

        <Campo rotulo="Matrícula">
          <input
            name="matricula"
            required
            autoComplete="off"
            className="campo num"
          />
        </Campo>
        <Campo rotulo="Cargo">
          <input name="cargo" autoComplete="off" className="campo" />
        </Campo>

        <Campo rotulo="E-mail de login">
          <input
            name="email"
            type="email"
            required
            autoComplete="off"
            autoCapitalize="none"
            className="campo"
          />
        </Campo>
        <Campo rotulo="Senha inicial" dica="Mínimo de 6 caracteres.">
          <input
            name="senha"
            type="text"
            required
            minLength={6}
            autoComplete="off"
            className="campo"
          />
        </Campo>

        <Campo rotulo="Acesso">
          <select name="papel" defaultValue="funcionario" className="campo">
            <option value="funcionario">Funcionário</option>
            <option value="rh">RH</option>
            <option value="admin">Administrador</option>
          </select>
        </Campo>

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-ink-2">
            Jornada diária
          </legend>
          <div className="flex items-center gap-2">
            <input
              name="horas"
              type="number"
              inputMode="numeric"
              min={0}
              max={24}
              defaultValue={8}
              aria-label="Horas"
              className="campo num w-20"
            />
            <span className="text-sm text-ink-3">h</span>
            <input
              name="minutos"
              type="number"
              inputMode="numeric"
              min={0}
              max={59}
              defaultValue={0}
              aria-label="Minutos"
              className="campo num w-20"
            />
            <span className="text-sm text-ink-3">min</span>
          </div>
        </fieldset>

        <div className="flex flex-col gap-3 sm:col-span-2">
          {state.error && <Aviso tom="erro">{state.error}</Aviso>}
          {state.ok && <Aviso tom="ok">Colaborador cadastrado.</Aviso>}
          <div className="flex justify-end">
            <Enviar />
          </div>
        </div>
      </form>
    </Cartao>
  );
}
