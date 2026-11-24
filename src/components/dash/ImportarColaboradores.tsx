"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  importarColaboradores,
  type ResultadoImportacao,
} from "@/app/admin/colaboradores/actions";
import { Aviso, Cartao, botao } from "@/components/ui";

const MODELO =
  "nome;matricula;email;senha;cargo;cpf;admissao;equipe;turno;horas_dia\n" +
  "Maria da Silva;0101;maria@empresa.com;;Costureira;;01/03/2024;Costura;;8\n";

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={botao("primario")}>
      {pending ? "Importando… (pode levar um minuto)" : "Importar"}
    </button>
  );
}

export function ImportarColaboradores() {
  const [aberto, setAberto] = useState(false);
  const [state, action] = useFormState<ResultadoImportacao, FormData>(importarColaboradores, {});

  if (!aberto) {
    return (
      <button type="button" onClick={() => setAberto(true)} className={botao("secundario", "md", "w-full sm:w-auto")}>
        Importar planilha
      </button>
    );
  }

  const ok = state.linhas?.filter((l) => !l.erro) ?? [];
  const falhas = state.linhas?.filter((l) => l.erro) ?? [];

  function baixarSenhas() {
    const csv =
      "﻿nome;email;senha inicial\r\n" +
      ok.map((l) => `"${l.nome.replace(/"/g, '""')}";${l.email};${l.senha}`).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "senhas-iniciais.csv" });
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Cartao className="mb-5 w-full p-5 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">Importar colaboradores por planilha</h2>
          <p className="mt-0.5 text-sm text-ink-3">
            Arquivo CSV (Excel → Salvar como → CSV). Obrigatórias: nome, matricula e email. Senha
            vazia = o sistema cria uma e mostra no final. Equipe e turno pelo nome exato cadastrado.
          </p>
        </div>
        <button type="button" onClick={() => setAberto(false)} className={botao("texto", "md", "!min-h-0 !px-0 shrink-0")}>
          Fechar
        </button>
      </div>

      <a
        href={`data:text/csv;charset=utf-8,${encodeURIComponent("﻿" + MODELO)}`}
        download="modelo-colaboradores.csv"
        className="text-sm font-medium text-brand underline underline-offset-4"
      >
        Baixar planilha modelo
      </a>

      <form action={action} className="mt-4 flex flex-wrap items-center gap-3">
        <input type="file" name="arquivo" accept=".csv,text/csv" required className="campo max-w-sm py-1.5 text-sm" />
        <Enviar />
      </form>

      {state.error && <Aviso tom="erro" className="mt-4">{state.error}</Aviso>}

      {state.linhas && (
        <div className="mt-5 flex flex-col gap-3">
          <Aviso tom={falhas.length ? "aviso" : "ok"}>
            {ok.length} {ok.length === 1 ? "pessoa cadastrada" : "pessoas cadastradas"}
            {falhas.length > 0 && `, ${falhas.length} com problema (veja abaixo)`}.
          </Aviso>
          {ok.length > 0 && (
            <div className="rounded-lg border border-warn-line bg-warn-tint p-4 text-sm text-ink-2">
              <p className="font-semibold text-ink">Guarde as senhas iniciais agora.</p>
              <p className="mt-1">
                Elas não aparecem de novo. Baixe a lista e entregue a cada pessoa.
              </p>
              <button type="button" onClick={baixarSenhas} className={botao("secundario", "md", "mt-3")}>
                Baixar senhas iniciais
              </button>
            </div>
          )}
          {falhas.length > 0 && (
            <ul className="divide-y divide-line rounded-lg border border-line text-sm">
              {falhas.map((l) => (
                <li key={l.linha} className="flex flex-wrap gap-x-3 px-3 py-2">
                  <span className="num text-ink-3">linha {l.linha}</span>
                  <span className="font-medium text-ink">{l.nome}</span>
                  <span className="text-danger">{l.erro}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Cartao>
  );
}
