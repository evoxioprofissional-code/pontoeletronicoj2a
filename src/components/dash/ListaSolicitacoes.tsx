"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  linkAnexo,
  responderSolicitacoes,
  type RespostaState,
} from "@/app/admin/solicitacoes/actions";
import { Avatar, Aviso, Etiqueta, botao } from "@/components/ui";
import { horaLocal, rotuloTipo } from "@/lib/ponto";
import {
  ROTULO_CATEGORIA,
  ROTULO_STATUS,
  TOM_STATUS,
  type Solicitacao,
} from "@/lib/solicitacoes";

export interface LinhaSolicitacao extends Solicitacao {
  nome: string;
  equipe: string | null;
  /** Horário atual da marcação, para pedidos de correção. */
  horaAtual: string | null;
}

const brData = (d: string) => d.split("-").reverse().join("/");

function Detalhe({ s }: { s: LinhaSolicitacao }) {
  if (s.categoria === "abonar") return <>Dia inteiro</>;
  const hora = s.marcado_em ? horaLocal(s.marcado_em) : "?";
  const tipo = s.tipo ? rotuloTipo(s.tipo) : "";
  if (s.categoria === "incluir") {
    return (
      <>
        {tipo} às <span className="num font-medium text-ink">{hora}</span>
      </>
    );
  }
  return (
    <>
      {tipo}: <span className="num line-through">{s.horaAtual ?? "?"}</span> →{" "}
      <span className="num font-medium text-ink">{hora}</span>
    </>
  );
}

function BotaoAnexo({ id }: { id: string }) {
  const [abrindo, setAbrindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  return (
    <span>
      <button
        type="button"
        disabled={abrindo}
        onClick={async () => {
          setErro(null);
          setAbrindo(true);
          // Abre a aba já no clique (o navegador bloqueia pop-up depois de esperar).
          const aba = window.open("", "_blank");
          const r = await linkAnexo(id);
          setAbrindo(false);
          if (r.url && aba) aba.location.href = r.url;
          else {
            aba?.close();
            setErro(r.error ?? "Não foi possível abrir.");
          }
        }}
        className="text-sm font-medium text-brand underline underline-offset-2"
      >
        {abrindo ? "Abrindo…" : "Ver anexo"}
      </button>
      {erro && <span className="ml-2 text-sm text-danger">{erro}</span>}
    </span>
  );
}

function Acoes({ selecionados }: { selecionados: number }) {
  const { pending } = useFormStatus();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="submit"
        name="decisao"
        value="aprovar"
        disabled={pending || selecionados === 0}
        className={botao("primario")}
      >
        Aprovar{selecionados > 1 ? ` ${selecionados}` : ""}
      </button>
      <button
        type="submit"
        name="decisao"
        value="recusar"
        disabled={pending || selecionados === 0}
        className={botao("perigo")}
      >
        Recusar{selecionados > 1 ? ` ${selecionados}` : ""}
      </button>
    </div>
  );
}

export function ListaSolicitacoes({
  linhas,
  pendentes,
}: {
  linhas: LinhaSolicitacao[];
  /** true = lista de pendentes (com seleção e ações). */
  pendentes: boolean;
}) {
  const [state, formAction] = useFormState<RespostaState, FormData>(
    responderSolicitacoes,
    {},
  );
  const [sel, setSel] = useState<Set<string>>(new Set());
  const todos = pendentes && linhas.length > 0 && sel.size === linhas.length;
  const alternar = (id: string) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <form
      action={async (fd) => {
        await formAction(fd);
        setSel(new Set());
      }}
    >
      {pendentes && (
        <div className="mb-3 flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 sm:flex-row sm:items-end">
          <label className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-sm font-medium text-ink-2">
              Resposta para a pessoa{" "}
              <span className="font-normal text-ink-3">(obrigatória ao recusar)</span>
            </span>
            <input
              name="resposta"
              maxLength={500}
              className="campo"
              placeholder="Ex.: aprovado conforme atestado."
            />
          </label>
          <Acoes selecionados={sel.size} />
        </div>
      )}

      {state.error && <Aviso tom="erro" className="mb-3">{state.error}</Aviso>}
      {state.ok && <Aviso tom="ok" className="mb-3">{state.ok}</Aviso>}

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        {pendentes && (
          <label className="flex items-center gap-3 border-b border-line bg-paper px-4 py-2.5 text-sm text-ink-2 sm:px-5">
            <input
              type="checkbox"
              checked={todos}
              onChange={() =>
                setSel(todos ? new Set() : new Set(linhas.map((l) => l.id)))
              }
              className="h-4 w-4 accent-[#0E4F5E]"
            />
            Selecionar todos ({linhas.length})
          </label>
        )}
        <ul className="divide-y divide-line">
          {linhas.map((s) => (
            <li key={s.id} className="flex gap-3 px-4 py-4 sm:px-5">
              {pendentes && (
                <input
                  type="checkbox"
                  name="id"
                  value={s.id}
                  checked={sel.has(s.id)}
                  onChange={() => alternar(s.id)}
                  aria-label={`Selecionar pedido de ${s.nome}`}
                  className="mt-2.5 h-4 w-4 shrink-0 accent-[#0E4F5E]"
                />
              )}
              <Avatar nome={s.nome} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-medium text-ink">{s.nome}</span>
                  {s.equipe && <span className="text-sm text-ink-3">{s.equipe}</span>}
                  {!pendentes && (
                    <span className="ml-auto">
                      <Etiqueta tom={TOM_STATUS[s.status]}>{ROTULO_STATUS[s.status]}</Etiqueta>
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-ink-2">
                  <span className="num font-semibold text-ink">
                    {s.dia ? brData(s.dia) : "—"}
                  </span>{" "}
                  · {ROTULO_CATEGORIA[s.categoria]} · <Detalhe s={s} />
                </p>
                <p className="mt-1.5 text-sm text-ink-2">“{s.justificativa}”</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-3">
                  <span>
                    Pedido em {brData(s.created_at.slice(0, 10))} às{" "}
                    {horaLocal(s.created_at)}
                  </span>
                  {s.anexo_path && <BotaoAnexo id={s.id} />}
                </div>
                {s.resposta && (
                  <p className="mt-2 rounded-md bg-paper px-3 py-2 text-sm text-ink-2">
                    <span className="font-medium text-ink">Resposta:</span> {s.resposta}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </form>
  );
}
