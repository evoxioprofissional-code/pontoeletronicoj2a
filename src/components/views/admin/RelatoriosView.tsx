import Link from "next/link";
import { CabecalhoPagina } from "@/components/dash/AdminShell";
import { SeletorMes } from "@/components/SeletorMes";
import { Avatar, Cartao, Etiqueta, TituloSecao, botao } from "@/components/ui";
import { ArrowRight } from "@/components/icons";
import { rotuloMes } from "@/lib/banco";

interface Pessoa {
  id: string;
  matricula: string;
  nome: string;
  ativo: boolean;
}

function Planilha({
  titulo,
  descricao,
  href,
}: {
  titulo: string;
  descricao: string;
  href: string;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4 sm:px-5">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-ink">{titulo}</p>
        <p className="mt-0.5 text-sm text-ink-3">{descricao}</p>
      </div>
      <a href={href} className={botao("secundario", "md", "shrink-0")}>
        Baixar planilha
      </a>
    </li>
  );
}

export function RelatoriosView({
  mes,
  mesAtual,
  pessoas,
}: {
  mes: string;
  mesAtual: string;
  pessoas: Pessoa[];
}) {
  return (
    <>
      <CabecalhoPagina
        titulo="Relatórios"
        descricao="Planilhas para a folha e espelho de ponto de cada pessoa."
        acao={<SeletorMes mes={mes} mesAtual={mesAtual} base="/admin/relatorios" />}
      />

      <section>
        <TituloSecao>Planilhas de {rotuloMes(mes).toLowerCase()}</TituloSecao>
        <Cartao as="div">
          <ul className="divide-y divide-line">
            <Planilha
              titulo="Resumo do banco de horas"
              descricao="Uma linha por pessoa: horas trabalhadas, previstas, saldo do mês e saldo acumulado."
              href={`/admin/relatorios/exportar?tipo=resumo&mes=${mes}`}
            />
            <Planilha
              titulo="Todas as marcações do mês"
              descricao="Uma linha por marcação, com data, hora, tipo e se foi ajustada ou incluída pelo RH."
              href={`/admin/relatorios/exportar?tipo=marcacoes&mes=${mes}`}
            />
          </ul>
        </Cartao>
        <p className="mt-2 text-sm text-ink-3">
          Os arquivos abrem no Excel e no Google Planilhas.
        </p>
      </section>

      <section className="mt-8">
        <TituloSecao>Espelho de ponto</TituloSecao>
        {pessoas.length === 0 ? (
          <Cartao as="div" className="px-5 py-8 text-center text-sm text-ink-2">
            Nenhum colaborador cadastrado.
          </Cartao>
        ) : (
          <Cartao as="div">
            <ul className="divide-y divide-line">
              {pessoas.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/espelho/${p.id}?mes=${mes}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-paper sm:px-5"
                  >
                    <Avatar nome={p.nome} tamanho="sm" />
                    <span className="min-w-0 flex-1 truncate font-medium text-ink">
                      {p.nome}
                    </span>
                    {!p.ativo && <Etiqueta>Inativo</Etiqueta>}
                    <span className="num text-sm text-ink-3">{p.matricula}</span>
                    <ArrowRight className="h-5 w-5 shrink-0 text-ink-3" />
                  </Link>
                </li>
              ))}
            </ul>
          </Cartao>
        )}
        <p className="mt-2 text-sm text-ink-3">
          Abra o espelho e use “Imprimir ou salvar PDF” para gerar a folha com
          espaço para assinatura.
        </p>
      </section>
    </>
  );
}
