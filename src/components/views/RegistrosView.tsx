import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Cartao, Etiqueta, botao } from "@/components/ui";
import {
  minutosTrabalhados,
  formatarMinutos,
  periodosTrabalhados,
  horaLocal,
  FUSO,
  type MarcacaoLite,
} from "@/lib/ponto";

export interface DiaRegistro {
  /** "AAAA-MM-DD" no fuso da operação. */
  chave: string;
  marcacoes: MarcacaoLite[];
}

export interface RegistrosViewProps {
  nome: string;
  gestor: boolean;
  /** Dias com marcação, do mais recente para o mais antigo. */
  dias: DiaRegistro[];
  /** Chave do dia de hoje, para tratar o período em aberto. */
  hoje: string;
}

const SEMANA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO,
  weekday: "short",
});
const MES = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO,
  month: "long",
  year: "numeric",
});

/** Meio-dia do dia indicado — evita virar o dia por causa do fuso. */
const dataDe = (chave: string) => new Date(`${chave}T12:00:00-03:00`);

export function RegistrosView({ nome, gestor, dias, hoje }: RegistrosViewProps) {
  const totais = dias.map((d) => minutosTrabalhados(d.marcacoes));
  const totalMes = totais.reduce((a, b) => a + b, 0);
  const mesBruto = MES.format(dataDe(hoje));
  const mes = mesBruto.charAt(0).toUpperCase() + mesBruto.slice(1);

  return (
    <AppShell nome={nome} gestor={gestor} abaAtiva="/app/registros">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 md:mb-7">
        <div>
          <p className="text-sm text-ink-3">{mes}</p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-ink md:text-[1.75rem]">
            Meus registros
          </h1>
        </div>
        <Link href="/app/espelho" className={botao("secundario")}>
          Espelho e banco de horas
        </Link>
      </header>

      <Cartao className="mb-4 grid grid-cols-2 divide-x divide-line">
        <div className="px-5 py-4">
          <p className="text-sm text-ink-3">Total no mês</p>
          <p className="num mt-0.5 text-2xl font-medium text-ink">
            {formatarMinutos(totalMes)}
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-ink-3">Dias com registro</p>
          <p className="num mt-0.5 text-2xl font-medium text-ink">
            {dias.length}
          </p>
        </div>
      </Cartao>

      {dias.length === 0 ? (
        <Cartao className="px-5 py-12 text-center">
          <p className="font-medium text-ink">Nenhuma marcação neste mês</p>
          <p className="mt-1 text-sm text-ink-3">
            Assim que você registrar o ponto, o dia aparece aqui.
          </p>
        </Cartao>
      ) : (
        <Cartao as="div">
          <ul className="divide-y divide-line">
            {dias.map((d, i) => {
              const data = dataDe(d.chave);
              const periodos = periodosTrabalhados(d.marcacoes);
              const ehHoje = d.chave === hoje;
              const aberto = periodos.some((p) => p.fim === null);
              return (
                <li
                  key={d.chave}
                  className="flex items-center gap-4 px-4 py-3.5 sm:px-5"
                >
                  <div className="w-11 shrink-0 text-center">
                    <p className="text-xs font-medium uppercase text-ink-3">
                      {SEMANA.format(data).replace(".", "")}
                    </p>
                    <p className="num text-xl font-medium leading-tight text-ink">
                      {d.chave.slice(8)}
                    </p>
                  </div>

                  <div className="min-w-0 flex-1">
                    <ul className="flex flex-wrap gap-x-4 gap-y-0.5">
                      {periodos.map((p, j) => (
                        <li key={j} className="num text-[0.9375rem] text-ink">
                          {horaLocal(p.inicio)}
                          <span className="mx-1 text-ink-3">–</span>
                          {p.fim ? (
                            horaLocal(p.fim)
                          ) : (
                            <span className="text-ink-3">
                              {ehHoje ? "agora" : "?"}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                    {(ehHoje || aberto) && (
                      <div className="mt-1">
                        {ehHoje ? (
                          <Etiqueta tom="info">Hoje</Etiqueta>
                        ) : (
                          <Etiqueta tom="aviso">Faltou registrar a saída</Etiqueta>
                        )}
                      </div>
                    )}
                  </div>

                  <p className="num shrink-0 text-right text-[0.9375rem] font-medium text-ink">
                    {formatarMinutos(totais[i])}
                  </p>
                </li>
              );
            })}
          </ul>
        </Cartao>
      )}
    </AppShell>
  );
}
