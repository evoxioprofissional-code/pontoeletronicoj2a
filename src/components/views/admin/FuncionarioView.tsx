import Link from "next/link";
import { BotaoConfirmar } from "@/components/dash/BotaoConfirmar";
import {
  Avatar,
  Campo,
  Cartao,
  Etiqueta,
  Progresso,
  TituloSecao,
  botao,
} from "@/components/ui";
import { ArrowLeft, ArrowRight, TipoIcon } from "@/components/icons";
import {
  formatarMinutos,
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
} from "@/app/admin/actions";

export interface MarcacaoAdmin {
  id: string;
  tipo: TipoDB;
  marcado_em: string;
  metodo_verificacao: string;
  ajustado: boolean;
}

export interface FuncionarioViewProps {
  func: { id: string; nome: string; matricula: string; cargo: string | null };
  cargaMin: number;
  trabalhadoMin: number;
  /** 0 = hoje, -1 = ontem… */
  offset: number;
  /** "AAAA-MM-DD" do dia mostrado. */
  dia: string;
  rotuloDia: string;
  marcacoes: MarcacaoAdmin[];
}

const navDia =
  "flex h-11 w-11 items-center justify-center rounded-lg border border-line-strong bg-surface text-ink transition-colors hover:border-ink-3";

export function FuncionarioView({
  func,
  cargaMin,
  trabalhadoMin,
  offset,
  dia,
  rotuloDia,
  marcacoes,
}: FuncionarioViewProps) {
  const base = `/admin/funcionario/${func.id}`;

  return (
    <>
      <Link
        href="/admin/colaboradores"
        className="mb-4 inline-flex min-h-[2.75rem] items-center gap-1.5 text-sm font-medium text-ink-2 hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Colaboradores
      </Link>

      <header className="mb-6 flex items-center gap-4">
        <Avatar nome={func.nome} tamanho="lg" />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight text-ink">
            {func.nome}
          </h1>
          <p className="truncate text-sm text-ink-3">
            Matrícula <span className="num">{func.matricula}</span>
            {func.cargo ? ` · ${func.cargo}` : ""}
          </p>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start lg:gap-6">
        <div className="flex flex-col gap-5">
          {/* Dia + total */}
          <Cartao className="p-5">
            <div className="flex items-center justify-between gap-3">
              <Link
                href={`${base}?d=${offset - 1}`}
                className={navDia}
                aria-label="Dia anterior"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="min-w-0 text-center">
                <p className="truncate font-semibold capitalize text-ink">
                  {rotuloDia}
                </p>
                <p className="num text-sm text-ink-3">
                  {dia.split("-").reverse().join("/")}
                </p>
              </div>
              {offset === 0 ? (
                <span
                  aria-hidden
                  className={`${navDia} pointer-events-none opacity-30`}
                >
                  <ArrowRight className="h-5 w-5" />
                </span>
              ) : (
                <Link
                  href={`${base}?d=${offset + 1}`}
                  className={navDia}
                  aria-label="Próximo dia"
                >
                  <ArrowRight className="h-5 w-5" />
                </Link>
              )}
            </div>

            <div className="mt-5 border-t border-line pt-4">
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <p className="num text-2xl font-medium text-ink">
                  {formatarMinutos(trabalhadoMin)}
                </p>
                <p className="text-sm text-ink-3">
                  de <span className="num">{formatarMinutos(cargaMin)}</span>
                </p>
              </div>
              <Progresso
                valor={trabalhadoMin}
                total={cargaMin}
                rotulo="Horas trabalhadas no dia"
              />
            </div>
          </Cartao>

          {/* Marcações */}
          <section>
            <TituloSecao>Marcações do dia</TituloSecao>
            {marcacoes.length === 0 ? (
              <Cartao as="div" className="px-5 py-8 text-center">
                <p className="font-medium text-ink">Nenhuma marcação neste dia</p>
                <p className="mt-1 text-sm text-ink-3">
                  Se a pessoa esqueceu de registrar, adicione abaixo.
                </p>
              </Cartao>
            ) : (
              <Cartao as="div">
                <ul className="divide-y divide-line">
                  {marcacoes.map((m) => (
                    <li key={m.id} className="p-4 sm:p-5">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <TipoIcon tipo={m.tipo} className="h-5 w-5 text-brand" />
                        <span className="font-medium text-ink">
                          {rotuloTipo(m.tipo)}
                        </span>
                        <span className="num text-ink-2">
                          {horaLocal(m.marcado_em)}
                        </span>
                        {m.metodo_verificacao === "manual" && (
                          <Etiqueta>Incluída pelo RH</Etiqueta>
                        )}
                        {m.ajustado && <Etiqueta tom="aviso">Ajustada</Etiqueta>}
                      </div>

                      <div className="flex flex-wrap items-end gap-3">
                        <form
                          action={ajustarMarcacao}
                          className="flex min-w-0 flex-1 flex-wrap items-end gap-3"
                        >
                          <input type="hidden" name="registroId" value={m.id} />
                          <input type="hidden" name="dia" value={dia} />
                          <Campo rotulo="Novo horário">
                            <input
                              type="time"
                              name="hora"
                              step={60}
                              defaultValue={horaLocal(m.marcado_em)}
                              className="campo num w-32"
                            />
                          </Campo>
                          <Campo rotulo="Motivo" className="min-w-[10rem] flex-1">
                            <input
                              type="text"
                              name="motivo"
                              placeholder="Ex.: esqueceu de registrar"
                              className="campo"
                            />
                          </Campo>
                          <button type="submit" className={botao("secundario")}>
                            Salvar
                          </button>
                        </form>
                        <form action={excluirMarcacao}>
                          <input type="hidden" name="registroId" value={m.id} />
                          <BotaoConfirmar
                            pergunta={`Excluir a marcação de ${rotuloTipo(m.tipo)} às ${horaLocal(m.marcado_em)}? Isso não pode ser desfeito.`}
                            className={botao("perigo")}
                          >
                            Excluir
                          </BotaoConfirmar>
                        </form>
                      </div>
                    </li>
                  ))}
                </ul>
              </Cartao>
            )}
          </section>

          {/* Adicionar */}
          <section>
            <TituloSecao>Adicionar marcação</TituloSecao>
            <Cartao as="div" className="p-4 sm:p-5">
              <form
                action={adicionarMarcacao}
                className="flex flex-wrap items-end gap-3"
              >
                <input type="hidden" name="funcionarioId" value={func.id} />
                <input type="hidden" name="dia" value={dia} />
                <Campo rotulo="Tipo" className="min-w-[11rem] flex-1">
                  <select name="tipo" defaultValue="entrada" className="campo">
                    {CICLO.map((t) => (
                      <option key={t} value={t}>
                        {rotuloTipo(t)}
                      </option>
                    ))}
                  </select>
                </Campo>
                <Campo rotulo="Horário">
                  <input
                    type="time"
                    name="hora"
                    step={60}
                    required
                    className="campo num w-32"
                  />
                </Campo>
                <button type="submit" className={botao("primario")}>
                  Adicionar
                </button>
              </form>
            </Cartao>
          </section>
        </div>

        {/* Jornada */}
        <section>
          <TituloSecao>Jornada diária</TituloSecao>
          <Cartao as="div" className="p-5">
            <form action={definirCarga}>
              <input type="hidden" name="funcionarioId" value={func.id} />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  name="horas"
                  min={0}
                  max={24}
                  defaultValue={Math.floor(cargaMin / 60)}
                  aria-label="Horas"
                  className="campo num w-20"
                />
                <span className="text-sm text-ink-3">h</span>
                <input
                  type="number"
                  inputMode="numeric"
                  name="minutos"
                  min={0}
                  max={59}
                  defaultValue={cargaMin % 60}
                  aria-label="Minutos"
                  className="campo num w-20"
                />
                <span className="text-sm text-ink-3">min</span>
              </div>
              <p className="mt-2 text-sm text-ink-3">
                Quanto esta pessoa deve trabalhar por dia. Usado para calcular
                horas extras e faltantes.
              </p>
              <button
                type="submit"
                className={botao("secundario", "md", "mt-4 w-full")}
              >
                Salvar jornada
              </button>
            </form>
          </Cartao>
        </section>
      </div>
    </>
  );
}
