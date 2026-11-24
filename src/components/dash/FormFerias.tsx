"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { lancarFerias, type EstadoFerias } from "@/app/admin/ferias/actions";
import { Aviso, Campo, botao } from "@/components/ui";

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={botao("primario")}>
      {pending ? "Lançando…" : "Lançar férias"}
    </button>
  );
}

export function FormFerias({
  pessoas,
}: {
  pessoas: { id: string; nome: string; saldo: number | null }[];
}) {
  const [state, action] = useFormState<EstadoFerias, FormData>(lancarFerias, {});
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const dias =
    inicio && fim && fim >= inicio
      ? Math.round((+new Date(fim) - +new Date(inicio)) / 86_400_000) + 1
      : null;

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_10rem_10rem_minmax(0,2fr)_auto] xl:items-end">
      <Campo rotulo="Colaborador">
        <select name="funcionario_id" required defaultValue="" className="campo">
          <option value="" disabled>
            Escolha…
          </option>
          {pessoas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
              {p.saldo !== null ? ` — saldo ${p.saldo} dias` : ""}
            </option>
          ))}
        </select>
      </Campo>
      <Campo rotulo="Início">
        <input
          type="date"
          name="inicio"
          required
          value={inicio}
          onChange={(e) => setInicio(e.target.value)}
          className="campo num"
        />
      </Campo>
      <Campo rotulo={dias ? `Fim (${dias} dias)` : "Fim"}>
        <input
          type="date"
          name="fim"
          required
          min={inicio || undefined}
          value={fim}
          onChange={(e) => setFim(e.target.value)}
          className="campo num"
        />
      </Campo>
      <Campo rotulo="Observação (opcional)">
        <input name="observacao" maxLength={300} className="campo" />
      </Campo>
      <Enviar />
      {(state.error || state.ok) && (
        <div className="sm:col-span-2 xl:col-span-5">
          <Aviso tom={state.error ? "erro" : "ok"}>{state.error ?? state.ok}</Aviso>
        </div>
      )}
    </form>
  );
}
