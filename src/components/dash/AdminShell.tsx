"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Marca } from "@/components/Logo";
import {
  ArrowLeft,
  ChartIcon,
  ClockIcon,
  ListIcon,
  PinIcon,
  UsersIcon,
} from "@/components/icons";

// Só entra no menu o que já funciona. Módulos futuros voltam quando existirem.
const ITENS = [
  { href: "/admin", rotulo: "Visão geral", Icone: ChartIcon, raiz: true },
  {
    href: "/admin/colaboradores",
    rotulo: "Colaboradores",
    Icone: UsersIcon,
    tambem: "/admin/funcionario",
  },
  {
    href: "/admin/banco-horas",
    rotulo: "Banco de horas",
    Icone: ClockIcon,
    tambem: "/admin/espelho",
  },
  { href: "/admin/relatorios", rotulo: "Relatórios", Icone: ListIcon },
  { href: "/admin/cerca", rotulo: "Local da fábrica", Icone: PinIcon },
] as const;

export function AdminShell({
  children,
  /** Em pré-visualizações, força qual item aparece ativo. */
  rotaAtiva,
}: {
  children: ReactNode;
  rotaAtiva?: string;
}) {
  const pathname = usePathname();
  const atual = rotaAtiva ?? pathname;
  const ativo = (it: (typeof ITENS)[number]) =>
    "raiz" in it
      ? atual === it.href
      : atual.startsWith(it.href) ||
        ("tambem" in it && atual.startsWith(it.tambem));

  return (
    <div className="min-h-screen bg-paper lg:flex print:block print:bg-white">
      {/* Barra lateral — computador */}
      <aside className="hidden w-60 shrink-0 border-r border-line bg-surface lg:block print:!hidden">
        <div className="sticky top-0 flex h-screen flex-col">
          <div className="flex h-16 items-center px-5">
            <Link href="/admin" aria-label="Painel do RH — visão geral">
              <Marca />
            </Link>
          </div>
          <p className="px-5 pb-2 pt-3 text-xs font-medium text-ink-3">
            Painel do RH
          </p>
          <nav aria-label="Painel do RH" className="flex-1 px-3">
            <ul className="flex flex-col gap-0.5">
              {ITENS.map((it) => {
                const on = ativo(it);
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      aria-current={on ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-[0.9375rem] font-medium transition-colors ${
                        on
                          ? "bg-brand-tint text-brand"
                          : "text-ink-2 hover:bg-paper hover:text-ink"
                      }`}
                    >
                      <it.Icone className="h-5 w-5 shrink-0" />
                      {it.rotulo}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="border-t border-line p-3">
            <Link
              href="/app"
              className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-ink-2 hover:bg-paper hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao meu ponto
            </Link>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Topo — celular e tablet */}
        <header className="safe-t sticky top-0 z-30 bg-surface shadow-bar lg:hidden print:hidden">
          <div className="flex h-14 items-center justify-between px-4 sm:px-6">
            <Link href="/admin" className="flex items-center gap-2.5">
              <Marca />
              <span className="rounded bg-paper px-1.5 py-0.5 text-xs font-medium text-ink-2 ring-1 ring-inset ring-line">
                RH
              </span>
            </Link>
            <Link
              href="/app"
              className="flex min-h-[2.75rem] items-center gap-1.5 text-sm font-medium text-ink-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Meu ponto
            </Link>
          </div>
          <nav aria-label="Painel do RH" className="overflow-x-auto px-2 sm:px-4">
            <ul className="flex min-w-max">
              {ITENS.map((it) => {
                const on = ativo(it);
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      aria-current={on ? "page" : undefined}
                      className={`relative block whitespace-nowrap px-3 py-3 text-sm font-medium ${
                        on ? "text-brand" : "text-ink-2"
                      }`}
                    >
                      {it.rotulo}
                      {on && (
                        <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-brand" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </header>

        <main className="mx-auto w-full max-w-[92rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 2xl:px-12 print:max-w-none print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}

/** Cabeçalho padrão de uma página do painel. */
export function CabecalhoPagina({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao?: ReactNode;
  acao?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {titulo}
        </h1>
        {descricao && (
          <p className="mt-1 text-[0.9375rem] text-ink-2">{descricao}</p>
        )}
      </div>
      {acao}
    </header>
  );
}
