"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  alterarVinculo,
  salvarCadastro,
  type CadastroState,
} from "@/app/admin/colaboradores/actions";
import { BotaoConfirmar } from "./BotaoConfirmar";
import { Aviso, Campo, botao } from "@/components/ui";

export interface CadastroDados {
  id: string;
  nome: string;
  matricula: string;
  cargo: string | null;
  email: string | null;
  telefone: string | null;
  cpf: string | null;
  pis: string | null;
  data_nascimento: string | null;
  data_admissao: string | null;
  desligado_em: string | null;
  ativo: boolean;
  papel: string;
  equipe_id: string | null;
  turno_id: string | null;
  turno_programado_id: string | null;
  turno_programado_em: string | null;
  gestor_id: string | null;
  observacoes: string | null;
}

interface Opcao {
  id: string;
  nome: string;
}

function Salvar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={botao("primario")}>
      {pending ? "Salvando…" : "Salvar cadastro"}
    </button>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <legend className="mb-3 text-sm font-semibold text-ink">{titulo}</legend>
      {children}
    </fieldset>
  );
}

export function CadastroFuncionario({
  d,
  equipes,
  turnos,
  gestores,
  souEu,
}: {
  d: CadastroDados;
  equipes: Opcao[];
  turnos: Opcao[];
  gestores: Opcao[];
  souEu: boolean;
}) {
  const [state, action] = useFormState<CadastroState, FormData>(salvarCadastro, {});

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-7">
        <input type="hidden" name="id" value={d.id} />

        <Grupo titulo="Dados pessoais">
          <Campo rotulo="Nome completo" className="sm:col-span-2">
            <input name="nome" required maxLength={120} defaultValue={d.nome} className="campo" />
          </Campo>
          <Campo rotulo="Data de nascimento">
            <input type="date" name="data_nascimento" defaultValue={d.data_nascimento ?? ""} className="campo num" />
          </Campo>
          <Campo rotulo="CPF">
            <input name="cpf" inputMode="numeric" maxLength={14} defaultValue={d.cpf ?? ""} placeholder="000.000.000-00" className="campo num" />
          </Campo>
          <Campo rotulo="PIS / NIT">
            <input name="pis" inputMode="numeric" maxLength={14} defaultValue={d.pis ?? ""} className="campo num" />
          </Campo>
          <Campo rotulo="Telefone">
            <input name="telefone" type="tel" maxLength={30} defaultValue={d.telefone ?? ""} className="campo" />
          </Campo>
          <Campo rotulo="E-mail de contato" dica="Não altera o e-mail usado para entrar no app.">
            <input name="email" type="email" maxLength={120} defaultValue={d.email ?? ""} className="campo" />
          </Campo>
        </Grupo>

        <Grupo titulo="Trabalho">
          <Campo rotulo="Matrícula">
            <input name="matricula" required maxLength={30} defaultValue={d.matricula} className="campo num" />
          </Campo>
          <Campo rotulo="Cargo">
            <input name="cargo" maxLength={80} defaultValue={d.cargo ?? ""} className="campo" />
          </Campo>
          <Campo rotulo="Data de admissão" dica="Usada no cálculo de férias.">
            <input type="date" name="data_admissao" defaultValue={d.data_admissao ?? ""} className="campo num" />
          </Campo>
          <Campo rotulo="Equipe">
            <select name="equipe_id" defaultValue={d.equipe_id ?? ""} className="campo">
              <option value="">Sem equipe</option>
              {equipes.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          </Campo>
          <Campo rotulo="Gestor direto">
            <select name="gestor_id" defaultValue={d.gestor_id ?? ""} className="campo">
              <option value="">Nenhum</option>
              {gestores.filter((g) => g.id !== d.id).map((g) => <option key={g.id} value={g.id}>{g.nome}</option>)}
            </select>
          </Campo>
          <Campo rotulo="Acesso ao sistema">
            <select name="papel" defaultValue={d.papel} className="campo" disabled={souEu}>
              <option value="funcionario">Funcionário</option>
              <option value="rh">RH</option>
              <option value="admin">Administrador</option>
            </select>
            {souEu && <input type="hidden" name="papel" value={d.papel} />}
          </Campo>
        </Grupo>

        <Grupo titulo="Turno">
          <Campo rotulo="Turno de trabalho" dica="Sem turno, vale a jornada diária abaixo, de segunda a sexta.">
            <select name="turno_id" defaultValue={d.turno_id ?? ""} className="campo">
              <option value="">Sem turno</option>
              {turnos.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </Campo>
          <Campo rotulo="Trocar para o turno (opcional)" dica="Programa uma troca de turno.">
            <select name="turno_programado_id" defaultValue={d.turno_programado_id ?? ""} className="campo">
              <option value="">Nenhuma troca programada</option>
              {turnos.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </Campo>
          <Campo rotulo="A partir de">
            <input type="date" name="turno_programado_em" defaultValue={d.turno_programado_em ?? ""} className="campo num" />
          </Campo>
        </Grupo>

        <Campo rotulo="Observações (aparece só para o RH)">
          <textarea name="observacoes" rows={2} maxLength={1000} defaultValue={d.observacoes ?? ""} className="campo resize-y" />
        </Campo>

        {state.error && <Aviso tom="erro">{state.error}</Aviso>}
        {state.ok && <Aviso tom="ok">{state.ok}</Aviso>}
        <div className="flex justify-end">
          <Salvar />
        </div>
      </form>

      {!souEu && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <div>
            <p className="font-medium text-ink">
              {d.ativo ? "Desligar colaborador" : "Colaborador desligado"}
            </p>
            <p className="text-sm text-ink-3">
              {d.ativo
                ? "A pessoa deixa de bater ponto e sai da lista de ativos. O histórico fica guardado."
                : `Desligado em ${d.desligado_em ? d.desligado_em.split("-").reverse().join("/") : "data não informada"}.`}
            </p>
          </div>
          <form action={alterarVinculo} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={d.id} />
            <input type="hidden" name="acao" value={d.ativo ? "desligar" : "reativar"} />
            {d.ativo && (
              <input type="date" name="data" aria-label="Data do desligamento" className="campo num w-auto" />
            )}
            <BotaoConfirmar
              pergunta={
                d.ativo
                  ? `Desligar ${d.nome}? A pessoa não vai mais conseguir bater ponto.`
                  : `Reativar ${d.nome}?`
              }
              className={botao(d.ativo ? "perigo" : "secundario")}
            >
              {d.ativo ? "Desligar" : "Reativar"}
            </BotaoConfirmar>
          </form>
        </div>
      )}
    </div>
  );
}
