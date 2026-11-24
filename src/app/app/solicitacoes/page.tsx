import { redirect } from "next/navigation";
import { createClient, usuarioAtual } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { NovaSolicitacao } from "@/components/NovaSolicitacao";
import { Aviso, Cartao, Etiqueta, TituloSecao, botao } from "@/components/ui";
import { cancelarSolicitacao } from "./actions";
import { dataLocal, horaLocal, rotuloTipo } from "@/lib/ponto";
import {
  COLUNAS_SOLICITACAO,
  ROTULO_CATEGORIA,
  ROTULO_STATUS,
  TOM_STATUS,
  type Categoria,
  type Solicitacao,
} from "@/lib/solicitacoes";

const brData = (d: string) => d.split("-").reverse().join("/");

function detalhe(s: Solicitacao): string {
  if (s.categoria === "abonar") return "Dia inteiro";
  const hora = s.marcado_em ? horaLocal(s.marcado_em) : "";
  const tipo = s.tipo ? rotuloTipo(s.tipo) : "";
  return s.categoria === "incluir" ? `${tipo} às ${hora}` : `${tipo} → ${hora}`;
}

export default async function MinhasSolicitacoes({
  searchParams,
}: {
  searchParams: { dia?: string; categoria?: string };
}) {
  const supabase = createClient();
  const user = await usuarioAtual(supabase);
  if (!user) redirect("/login");

  const { data: eu } = await supabase
    .from("funcionarios")
    .select("id, nome, papel, empresa_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!eu) redirect("/app");

  const { data, error } = await supabase
    .from("ajustes_ponto")
    .select(COLUNAS_SOLICITACAO)
    .eq("funcionario_id", eu.id)
    .order("created_at", { ascending: false })
    .limit(50);
  const pedidos = (data ?? []) as Solicitacao[];
  const moduloAtivo = !error;

  const hoje = dataLocal(new Date());
  const diaInicial =
    searchParams.dia && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.dia) && searchParams.dia <= hoje
      ? searchParams.dia
      : undefined;
  const cat = ["incluir", "alterar", "abonar"].includes(searchParams.categoria ?? "")
    ? (searchParams.categoria as Categoria)
    : undefined;

  return (
    <AppShell
      nome={eu.nome}
      gestor={eu.papel === "rh" || eu.papel === "admin"}
      abaAtiva="/app/registros"
    >
      <header className="mb-5 md:mb-7">
        <h1 className="text-2xl font-semibold tracking-tight text-ink md:text-[1.75rem]">
          Pedir ajuste ao RH
        </h1>
        <p className="mt-1 text-[0.9375rem] text-ink-2">
          Esqueceu de bater o ponto, bateu no horário errado ou precisa abonar
          um dia? Peça aqui.
        </p>
      </header>

      {!moduloAtivo ? (
        <Aviso tom="aviso">
          Os pedidos de ajuste ainda não foram ativados pela empresa. Fale
          diretamente com o RH.
        </Aviso>
      ) : (
        <>
          <Cartao className="p-5 sm:p-6">
            <NovaSolicitacao
              empresaId={eu.empresa_id}
              funcionarioId={eu.id}
              hoje={hoje}
              diaInicial={diaInicial}
              categoriaInicial={cat}
            />
          </Cartao>

          <section className="mt-8">
            <TituloSecao>Meus pedidos</TituloSecao>
            {pedidos.length === 0 ? (
              <Cartao as="div" className="px-5 py-8 text-center text-sm text-ink-3">
                Você ainda não fez nenhum pedido.
              </Cartao>
            ) : (
              <Cartao as="div">
                <ul className="divide-y divide-line">
                  {pedidos.map((p) => (
                    <li key={p.id} className="px-4 py-4 sm:px-5">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="num font-semibold text-ink">
                          {p.dia ? brData(p.dia) : "—"}
                        </span>
                        <span className="text-ink">{ROTULO_CATEGORIA[p.categoria]}</span>
                        <span className="text-sm text-ink-3">{detalhe(p)}</span>
                        <span className="ml-auto">
                          <Etiqueta tom={TOM_STATUS[p.status]}>
                            {ROTULO_STATUS[p.status]}
                          </Etiqueta>
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm text-ink-2">{p.justificativa}</p>
                      {p.resposta && (
                        <p className="mt-2 rounded-md bg-paper px-3 py-2 text-sm text-ink-2">
                          <span className="font-medium text-ink">Resposta do RH:</span>{" "}
                          {p.resposta}
                        </p>
                      )}
                      {p.status === "pendente" && (
                        <form action={cancelarSolicitacao} className="mt-2">
                          <input type="hidden" name="id" value={p.id} />
                          <button
                            type="submit"
                            className={botao("texto", "md", "!min-h-0 !px-0 text-sm")}
                          >
                            Desistir do pedido
                          </button>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
              </Cartao>
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}
