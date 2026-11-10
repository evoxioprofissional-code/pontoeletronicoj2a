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
 * Estrutura do app do funcionário.
 * Celular: barra no topo + abas embaixo (ao alcance do polegar).
 * Computador/tablet: as abas sobem para a barra do topo.
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
    atual === href || (href === "/app/registros" && atual === "/app/espelho");

  return (
    <div className="min-h-dvh bg-paper print:bg-white">
      <header className="safe-t sticky top-0 z-30 bg-surface shadow-bar print:hidden">
        <div className="app-gutter mx-auto flex h-14 max-w-5xl items-center gap-2 md:gap-6">
          <Link href="/app" aria-label="j2aponto — início" className="flex min-h-11 shrink-0 items-center rounded-lg">
            <Marca />
          </Link>

          <nav aria-label="Principal" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {ABAS.map(({ href, rotulo }) => (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={ativa(href) ? "page" : undefined}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      ativa(href)
                        ? "bg-brand-tint text-brand"
                        : "text-ink-2 hover:bg-paper hover:text-ink"
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
                className="hidden rounded-md border border-line-strong px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-ink-3 md:inline-flex"
              >
                Painel do RH
              </Link>
            )}
            <Link
              href="/app/perfil"
              aria-label={`Perfil de ${nome}`}
              className="hidden rounded-lg md:block"
            >
              <Avatar nome={nome} tamanho="sm" />
            </Link>
          </div>
        </div>
      </header>

      <main className="app-gutter mx-auto max-w-5xl pb-[calc(4.75rem+env(safe-area-inset-bottom))] pt-5 md:pb-12 md:pt-8 print:max-w-none print:p-0">
        {children}
      </main>

      <nav
        aria-label="Principal"
        className="app-gutter fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden print:hidden"
      >
        <ul className="mx-auto flex max-w-md">
          {ABAS.map(({ href, rotulo, Icone }) => {
            const on = ativa(href);
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={on ? "page" : undefined}
                  className={`flex h-14 touch-manipulation flex-col items-center justify-center gap-0.5 rounded-lg text-xs font-semibold transition-colors active:bg-paper ${
                    on ? "text-brand" : "text-ink-3"
                  }`}
                >
                  <span className={`flex h-7 w-14 items-center justify-center rounded-full ${on ? "bg-brand-tint" : ""}`}>
                    <Icone className="h-5 w-5" />
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
