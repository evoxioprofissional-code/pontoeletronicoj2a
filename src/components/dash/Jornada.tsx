"use client";

import { useCallback, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  criarEquipe,
  criarFeriado,
  excluirEquipe,
  excluirFeriado,
  excluirTurno,
  importarNacionais,
  type Estado,
} from "@/app/admin/jornada/actions";
import { FormTurno } from "./FormTurno";
import { BotaoConfirmar } from "./BotaoConfirmar";
import { Aviso, Cartao, Campo, TituloSecao, botao } from "@/components/ui";
import { PlusIcon } from "@/components/icons";
import { formatarMinutos } from "@/lib/ponto";
import { jornadaSemanal, resumoEscala, type Turno } from "@/lib/turnos";

function Enviar({ children, variante = "primario" }: { children: React.ReactNode; variante?: "primario" | "secundario" }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={botao(variante, "md", "shrink-0")}>
      {pending ? "Salvando…" : children}
    </button>
  );
}

const textoExcluir = "text-sm font-medium text-danger hover:underline underline-offset-2";

/* ------------------------------ Turnos ------------------------------ */

export function SecaoTurnos({
  turnos,
  pessoasPorTurno,
}: {
  turnos: Turno[];
  pessoasPorTurno: Record<string, number>;
}) {
  const [editando, setEditando] = useState<Turno | "novo" | null>(null);
  const fechar = useCallback(() => setEditando(null), []);

  return (
    <section>
      <TituloSecao
        acao={
          !editando && (
            <button
              type="button"
              onClick={() => setEditando("novo")}
              className={botao("secundario", "md", "!min-h-[2.25rem] text-sm")}
            >
              <PlusIcon className="h-4 w-4" /> Novo turno
            </button>
          )
        }
      >
        Turnos de trabalho
      </TituloSecao>
      <p className="-mt-1 mb-3 text-sm text-ink-3">
        O turno define quanto cada pessoa deve trabalhar em cada dia da semana e
        a partir de que horário conta atraso.
      </p>

      {editando && (
        <Cartao className="mb-4 p-5 sm:p-6">
          <h3 className="mb-4 font-semibold text-ink">
            {editando === "novo" ? "Novo turno" : `Editar ${editando.nome}`}
          </h3>
          <FormTurno
            key={editando === "novo" ? "novo" : editando.id}
            turno={editando === "novo" ? undefined : editando}
            onFechar={fechar}
          />
        </Cartao>
      )}

      {turnos.length === 0 ? (
        <Cartao as="div" className="px-5 py-8 text-center text-sm text-ink-3">
          Nenhum turno cadastrado. Sem turno, vale a jornada diária de cada
          pessoa, de segunda a sexta.
        </Cartao>
      ) : (
        <Cartao as="div">
          <ul className="divide-y divide-line">
            {turnos.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:px-5">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{t.nome}</p>
                  <p className="text-sm text-ink-3">
                    {resumoEscala(t.escala)} ·{" "}
                    <span className="num">{formatarMinutos(jornadaSemanal(t.escala))}</span>{" "}
                    por semana · tolerância {t.tolerancia_min} min
                  </p>
                </div>
                <span className="text-sm text-ink-2">
                  {pessoasPorTurno[t.id] ?? 0}{" "}
                  {(pessoasPorTurno[t.id] ?? 0) === 1 ? "pessoa" : "pessoas"}
                </span>
                <button
                  type="button"
                  onClick={() => setEditando(t)}
                  className="text-sm font-medium text-brand hover:underline underline-offset-2"
                >
                  Editar
                </button>
                <form action={excluirTurno}>
                  <input type="hidden" name="id" value={t.id} />
                  <BotaoConfirmar
                    pergunta={`Excluir o turno "${t.nome}"? Quem estiver nele volta a usar a jornada diária, de segunda a sexta.`}
                    className={textoExcluir}
                  >
                    Excluir
                  </BotaoConfirmar>
                </form>
              </li>
            ))}
          </ul>
        </Cartao>
      )}
    </section>
  );
}

/* ------------------------------ Equipes ----------------------------- */

export function SecaoEquipes({
  equipes,
  pessoasPorEquipe,
}: {
  equipes: { id: string; nome: string }[];
  pessoasPorEquipe: Record<string, number>;
}) {
  const [state, action] = useFormState<Estado, FormData>(criarEquipe, {});
  return (
    <section>
      <TituloSecao>Equipes</TituloSecao>
      <p className="-mt-1 mb-3 text-sm text-ink-3">
        Setores da fábrica (ex.: Costura, Corte). Servem para filtrar relatórios.
      </p>
      <Cartao as="div">
        <form action={action} className="flex gap-2 border-b border-line p-4 sm:p-5">
          <input name="nome" required maxLength={60} placeholder="Nome da equipe" className="campo" />
          <Enviar variante="secundario">Adicionar</Enviar>
        </form>
        {(state.error || state.ok) && (
          <div className="px-4 pt-3 sm:px-5">
            <Aviso tom={state.error ? "erro" : "ok"}>{state.error ?? state.ok}</Aviso>
          </div>
        )}
        {equipes.length === 0 ? (
          <p className="px-5 py-6 text-sm text-ink-3">Nenhuma equipe cadastrada.</p>
        ) : (
          <ul className="divide-y divide-line">
            {equipes.map((e) => (
              <li key={e.id} className="flex items-center gap-4 px-4 py-3 sm:px-5">
                <span className="min-w-0 flex-1 truncate font-medium text-ink">{e.nome}</span>
                <span className="text-sm text-ink-3">{pessoasPorEquipe[e.id] ?? 0}</span>
                <form action={excluirEquipe}>
                  <input type="hidden" name="id" value={e.id} />
                  <BotaoConfirmar
                    pergunta={`Excluir a equipe "${e.nome}"? As pessoas dela ficam sem equipe.`}
                    className={textoExcluir}
                  >
                    Excluir
                  </BotaoConfirmar>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Cartao>
    </section>
  );
}

/* ------------------------------ Feriados ---------------------------- */

const SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export function SecaoFeriados({
  feriados,
  ano,
}: {
  feriados: { id: string; data: string; nome: string }[];
  ano: number;
}) {
  const [s1, novo] = useFormState<Estado, FormData>(criarFeriado, {});
  const [s2, importar] = useFormState<Estado, FormData>(importarNacionais, {});
  const msg = s1.error || s1.ok ? s1 : s2;

  return (
    <section>
      <TituloSecao>Feriados de {ano}</TituloSecao>
      <p className="-mt-1 mb-3 text-sm text-ink-3">
        Em feriado ninguém deve horas. Quem trabalhar ganha saldo positivo.
      </p>
      <Cartao as="div">
        <div className="flex flex-col gap-4 border-b border-line p-4 sm:p-5">
          <form action={importar} className="flex flex-wrap items-center gap-3">
            <input type="hidden" name="ano" value={ano} />
            <Enviar variante="secundario">Adicionar feriados nacionais de {ano}</Enviar>
            <label className="flex items-center gap-2 text-sm text-ink-2">
              <input type="checkbox" name="facultativos" className="h-4 w-4" />
              Incluir Carnaval e Corpus Christi
            </label>
          </form>
          <form action={novo} className="flex flex-wrap items-end gap-3">
            <Campo rotulo="Data">
              <input type="date" name="data" required className="campo num" />
            </Campo>
            <Campo rotulo="Nome" className="min-w-[12rem] flex-1">
              <input name="nome" required maxLength={80} placeholder="Ex.: Aniversário da cidade" className="campo" />
            </Campo>
            <Enviar>Adicionar</Enviar>
          </form>
          {(msg.error || msg.ok) && (
            <Aviso tom={msg.error ? "erro" : "ok"}>{msg.error ?? msg.ok}</Aviso>
          )}
        </div>
        {feriados.length === 0 ? (
          <p className="px-5 py-6 text-sm text-ink-3">Nenhum feriado cadastrado em {ano}.</p>
        ) : (
          <ul className="divide-y divide-line">
            {feriados.map((f) => (
              <li key={f.id} className="flex items-center gap-4 px-4 py-3 sm:px-5">
                <span className="num w-[4.5rem] shrink-0 font-semibold text-ink">
                  {f.data.slice(8)}/{f.data.slice(5, 7)}
                </span>
                <span className="w-8 shrink-0 text-sm text-ink-3">
                  {SEMANA[new Date(`${f.data}T12:00:00Z`).getUTCDay()]}
                </span>
                <span className="min-w-0 flex-1 truncate text-ink">{f.nome}</span>
                <form action={excluirFeriado}>
                  <input type="hidden" name="id" value={f.id} />
                  <BotaoConfirmar pergunta={`Remover o feriado "${f.nome}"?`} className={textoExcluir}>
                    Remover
                  </BotaoConfirmar>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Cartao>
    </section>
  );
}
