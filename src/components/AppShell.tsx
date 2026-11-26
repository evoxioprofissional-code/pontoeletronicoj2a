"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Marca } from "./Logo";
import { Avatar } from "./ui";
import { HomeIcon, ListIcon, UserIcon } from "./icons";

const ABAS = [
  { href: "/app", rotulo: "Início", Icone: HomeIcon },
  { href: "/app/registros", rotulo: "Registros", Icone: ListIcon },
  { href: "/app/perfil", rotulo: "Perfil", Icone: UserIcon },
] as const;

/**
 * Estrutura do app do funcionário, no estilo de app nativo.
 * Celular: barra de vidro no topo + barra de abas embaixo.
 * Computador/tablet: abas em pílula na barra do topo.
 */
export function AppShell({
  nome,
  gestor = false,
  children,
  /** Em pré-visualizações, força qual aba aparece ativa. */
  abaAtiva,
}: {
  nome: string;
  gestor?: boolean;
  children: ReactNode;
  abaAtiva?: string;
}) {
  const pathname = usePathname();
  const atual = abaAtiva ?? pathname;
  const ativa = (href: string) =>
    atual === href ||
    (href === "/app/registros" &&
      (atual === "/app/espelho" || atual.startsWith("/app/solicitacoes")));

  return (
    <div className="min-h-dvh bg-paper print:bg-white">
      <header className="vidro safe-t sticky top-0 z-30 border-b border-line print:hidden">
        <div className="app-gutter mx-auto flex h-[3.25rem] max-w-5xl items-center gap-2 md:h-16 md:gap-8">
          <Link href="/app" aria-label="j2aponto — início" className="toque flex min-h-11 shrink-0 items-center rounded-xl">
            <Marca />
          </Link>

          <nav aria-label="Principal" className="hidden md:block">
            <ul className="flex items-center gap-1.5">
              {ABAS.map(({ href, rotulo }) => (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={ativa(href) ? "page" : undefined}
                    className={`toque block rounded-xl border px-4 py-2 text-sm font-bold ${
                      ativa(href)
                        ? "border-brand-line bg-brand-tint text-brand-soft"
                        : "border-transparent text-ink-2 hover:bg-sunken hover:text-ink"
                    }`}
                  >
                    {rotulo}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {gestor && (
              <Link
                href="/admin"
                className="toque hidden rounded-full border border-brand-line bg-brand-tint px-4 py-2 text-sm font-bold text-brand-soft md:inline-flex"
              >
                Painel do RH
              </Link>
            )}
            <Link href="/app/perfil" aria-label={`Perfil de ${nome}`} className="toque rounded-full">
              <Avatar nome={nome} tamanho="sm" />
            </Link>
          </div>
        </div>
      </header>

      <main className="app-gutter mx-auto max-w-5xl animate-fade-up pb-[calc(6.25rem+env(safe-area-inset-bottom))] pt-5 md:pb-14 md:pt-10 print:max-w-none print:p-0">
        {children}
      </main>

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-30 rounded-t-[22px] border border-b-0 border-line bg-surface px-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-8px_24px_-12px_rgb(14_20_22/0.18)] md:hidden print:hidden"
      >
        <ul className="mx-auto flex max-w-md">
          {ABAS.map(({ href, rotulo, Icone }) => {
            const on = ativa(href);
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={on ? "page" : undefined}
                  className={`toque flex min-h-[3.6rem] touch-manipulation flex-col items-center justify-start gap-0.5 text-[0.75rem] font-semibold ${
                    on ? "text-brand" : "text-ink-3"
                  }`}
                >
                  <span
                    className={`flex h-[2.15rem] w-[3.4rem] items-center justify-center rounded-[11px] border ${
                      on ? "border-brand-line bg-brand-tint" : "border-transparent"
                    }`}
                  >
                    <Icone className="h-[1.4rem] w-[1.4rem]" strokeWidth={on ? 2.1 : 1.8} />
                  </span>
                  {rotulo}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
