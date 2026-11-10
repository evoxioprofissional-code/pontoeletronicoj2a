import Link from "next/link";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { Avatar, Cartao, Etiqueta, TituloSecao, botao } from "@/components/ui";
import { ArrowRight, LogoutIcon, PhoneIcon, PinIcon } from "@/components/icons";
import { sair } from "@/app/app/actions";

export interface PerfilViewProps {
  nome: string;
  cargo: string | null;
  matricula: string;
  papel: string;
  empresa: string | null;
  temFace: boolean;
  cerca: { nome: string; endereco: string | null; raio_metros: number } | null;
}

const PAPEL: Record<string, string> = {
  funcionario: "Funcionário",
  rh: "RH",
  admin: "Administrador",
};

function Linha({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-3.5">
      <dt className="text-sm text-ink-3">{rotulo}</dt>
      <dd className="min-w-0 break-words text-right text-[0.9375rem] font-medium text-ink">
        {children}
      </dd>
    </div>
  );
}

export function PerfilView({
  nome,
  cargo,
  matricula,
  papel,
  empresa,
  temFace,
  cerca,
}: PerfilViewProps) {
  const gestor = papel === "rh" || papel === "admin";

  return (
    <AppShell nome={nome} gestor={gestor} abaAtiva="/app/perfil">
      <header className="mb-5 flex items-center gap-4 md:mb-7">
        <Avatar nome={nome} tamanho="lg" />
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-semibold tracking-tight text-ink">
            {nome}
          </h1>
          <p className="break-words text-sm text-ink-3">
            {cargo ? `${cargo} · ` : ""}Matrícula{" "}
            <span className="num">{matricula}</span>
          </p>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start lg:gap-6">
        <div>
          <TituloSecao>Seus dados</TituloSecao>
          <Cartao as="div">
            <dl className="divide-y divide-line">
              <Linha rotulo="Empresa">{empresa ?? "—"}</Linha>
              <Linha rotulo="Acesso">{PAPEL[papel] ?? papel}</Linha>
              <Linha rotulo="Reconhecimento facial">
                {temFace ? (
                  <Etiqueta tom="ok">Cadastrado</Etiqueta>
                ) : (
                  <Etiqueta tom="aviso">Não cadastrado</Etiqueta>
                )}
              </Linha>
            </dl>
          </Cartao>
          {!temFace && (
            <p className="mt-2 text-sm text-ink-3">
              Cadastre seu rosto na tela{" "}
              <Link href="/app" className="font-medium text-brand underline">
                Início
              </Link>{" "}
              para poder registrar o ponto.
            </p>
          )}
        </div>

        <div>
          <TituloSecao>Local de trabalho</TituloSecao>
          {cerca ? (
            <Cartao as="div" className="p-5">
              <p className="flex items-center gap-2 font-medium text-ink">
                <PinIcon className="h-5 w-5 shrink-0 text-brand" />
                {cerca.nome}
              </p>
              {cerca.endereco && (
                <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
                  {cerca.endereco}
                </p>
              )}
              <p className="mt-3 border-t border-line pt-3 text-sm text-ink-3">
                Você consegue registrar o ponto a até{" "}
                <span className="num font-medium text-ink">
                  {cerca.raio_metros} m
                </span>{" "}
                deste local.
              </p>
            </Cartao>
          ) : (
            <Cartao as="div" className="p-5 text-sm text-ink-2">
              O RH ainda não cadastrou o local da fábrica.
            </Cartao>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:mt-8">
        <Link href="/instalar" className={botao("secundario")}>
          <PhoneIcon className="h-5 w-5" />
          Instalar no celular
        </Link>
        {gestor && (
          <Link href="/admin" className={botao("secundario", "md", "sm:w-auto")}>
            Abrir painel do RH
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
        <form action={sair} className="sm:ml-auto">
          <button type="submit" className={botao("perigo", "md", "w-full")}>
            <LogoutIcon className="h-[1.125rem] w-[1.125rem]" />
            Sair da conta
          </button>
        </form>
      </div>
    </AppShell>
  );
}
