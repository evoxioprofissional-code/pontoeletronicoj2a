"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Marca } from "@/components/Logo";
import {
  ArrowLeft,
  CalendarIcon,
  ChartIcon,
  ClockIcon,
  InboxIcon,
  ListIcon,
  PinIcon,
  SunIcon,
  UsersIcon,
} from "@/components/icons";

// Só entra no menu o que já funciona. Módulos futuros voltam quando existirem.
const ITENS = [
  { href: "/admin", rotulo: "Visão geral", Icone: ChartIcon, raiz: true },
  { href: "/admin/solicitacoes", rotulo: "Solicitações", Icone: InboxIcon },
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
  { href: "/admin/jornada", rotulo: "Turnos e feriados", Icone: CalendarIcon },
  { href: "/admin/ferias", rotulo: "Férias", Icone: SunIcon },
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
      <aside className="hidden w-64 shrink-0 border-r border-line bg-surface lg:block print:!hidden">
        <div className="sticky top-0 flex h-screen flex-col">
          <div className="flex h-20 items-center px-6">
            <Link href="/admin" aria-label="Painel do RH — visão geral">
              <Marca />
            </Link>
          </div>
          <p className="px-6 pb-2 text-[0.75rem] font-semibold uppercase tracking-[0.06em] text-ink-3">
            Painel do RH
          </p>
          <nav aria-label="Painel do RH" className="flex-1 px-4">
            <ul className="flex flex-col gap-0.5">
              {ITENS.map((it) => {
                const on = ativo(it);
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      aria-current={on ? "page" : undefined}
                      className={`toque flex items-center gap-3 rounded-xl border px-3 py-2 text-[0.9375rem] font-bold ${
                        on
                          ? "border-brand-line bg-brand-tint text-brand-soft"
                          : "border-transparent text-ink-2 hover:bg-sunken hover:text-ink"
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[0.5rem] ${
                          on ? "bg-brand text-on-brand" : "border border-line-strong bg-sunken text-ink-2"
                        }`}
                      >
                        <it.Icone className="h-[1.05rem] w-[1.05rem]" />
                      </span>
                      {it.rotulo}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="p-4">
            <Link
              href="/app"
              className="toque flex items-center gap-2 rounded-ctl px-3 py-2.5 text-sm font-semibold text-ink-2 hover:bg-surface/60 hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao meu ponto
            </Link>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Topo — celular e tablet */}
        <header className="vidro safe-t sticky top-0 z-30 border-b border-line lg:hidden print:hidden">
          <div className="flex h-14 items-center justify-between px-4 sm:px-6">
            <Link href="/admin" className="flex items-center gap-2.5">
              <Marca />
              <span className="rounded-full bg-sunken px-2 py-0.5 text-xs font-semibold text-ink-2">
                RH
              </span>
            </Link>
            <Link
              href="/app"
              className="toque flex min-h-[2.75rem] items-center gap-1 text-[0.875rem] font-bold text-brand-soft"
            >
              <ArrowLeft className="h-4 w-4" />
              Meu ponto
            </Link>
          </div>
          <nav aria-label="Painel do RH" className="overflow-x-auto px-3 pb-2.5 sm:px-5">
            <ul className="flex min-w-max gap-1.5">
              {ITENS.map((it) => {
                const on = ativo(it);
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      aria-current={on ? "page" : undefined}
                      className={`toque block whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold ${
                        on ? "border border-brand-line bg-brand-tint text-brand-soft" : "border border-line-strong text-ink-2"
                      }`}
                    >
                      {it.rotulo}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </header>

        <main className="mx-auto w-full max-w-[92rem] animate-fade-up px-4 py-6 sm:px-6 lg:py-10 lg:pl-4 lg:pr-10 2xl:pr-14 print:max-w-none print:p-0">
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
    <header className="mb-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        <h1 className="titulo-grande text-ink">{titulo}</h1>
        {descricao && (
          <p className="mt-1.5 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-2">{descricao}</p>
        )}
      </div>
      {acao}
    </header>
  );
}
