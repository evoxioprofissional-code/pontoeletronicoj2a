"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/Logo";

interface Item {
  label: string;
  href: string;
}
const NAV: { grupo: string; itens: Item[] }[] = [
  {
    grupo: "Análise Inteligente",
    itens: [{ label: "Métricas e Gráficos", href: "/admin" }],
  },
  {
    grupo: "Gerenciamento",
    itens: [
      { label: "Solicitações", href: "/admin/em-breve?secao=Solicita%C3%A7%C3%B5es" },
      { label: "Controle de Ponto", href: "/admin/colaboradores" },
      { label: "Férias", href: "/admin/em-breve?secao=F%C3%A9rias" },
      { label: "Locais", href: "/admin/cerca" },
    ],
  },
  {
    grupo: "Relatórios",
    itens: [
      { label: "Espelho de ponto", href: "/admin/em-breve?secao=Espelho+de+ponto" },
      { label: "Relatórios Gerenciais", href: "/admin/em-breve?secao=Relat%C3%B3rios+Gerenciais" },
      { label: "Relatórios Fiscais", href: "/admin/em-breve?secao=Relat%C3%B3rios+Fiscais" },
      { label: "Exportação folha", href: "/admin/em-breve?secao=Exporta%C3%A7%C3%A3o+de+folha" },
      { label: "Importar Holerite", href: "/admin/em-breve?secao=Importar+Holerite" },
    ],
  },
  {
    grupo: "Sistema",
    itens: [
      { label: "Colaboradores", href: "/admin/colaboradores" },
      { label: "Configurações", href: "/admin/em-breve?secao=Configura%C3%A7%C3%B5es" },
      { label: "Documentos", href: "/admin/em-breve?secao=Documentos" },
      { label: "Reembolsos", href: "/admin/em-breve?secao=Reembolsos" },
      { label: "Financeiro", href: "/admin/em-breve?secao=Financeiro" },
    ],
  },
  {
    grupo: "Gestão de Eventos",
    itens: [
      { label: "Lista de eventos", href: "/admin/em-breve?secao=Lista+de+eventos" },
      { label: "Cerca virtual", href: "/admin/cerca" },
    ],
  },
  {
    grupo: "Denúncias",
    itens: [
      { label: "Nova denúncia", href: "/admin/em-breve?secao=Nova+den%C3%BAncia" },
      { label: "Gestão de denúncias", href: "/admin/em-breve?secao=Gest%C3%A3o+de+den%C3%BAncias" },
    ],
  },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-5 px-3 py-4">
      {NAV.map((g) => (
        <div key={g.grupo}>
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted/70">
            {g.grupo}
          </p>
          <ul className="flex flex-col gap-0.5">
            {g.itens.map((it) => {
              const base = it.href.split("?")[0];
              const active = pathname === base && base !== "/admin/em-breve";
              return (
                <li key={it.label}>
                  <Link
                    href={it.href}
                    onClick={onNavigate}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                      active
                        ? "bg-amber/10 font-semibold text-amber"
                        : "text-ink/80 hover:bg-steel-line hover:text-ink"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        active ? "bg-amber" : "bg-muted/50"
                      }`}
                    />
                    {it.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function Sidebar() {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      {/* Topo mobile */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-steel-line bg-graphite px-4 py-3 lg:hidden">
        <Wordmark className="!text-lg" />
        <button
          onClick={() => setAberto(true)}
          className="rounded-lg bg-steel px-3 py-2 text-sm text-ink ring-1 ring-steel-line"
          aria-label="Abrir menu"
        >
          ☰ Menu
        </button>
      </div>

      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-steel-line bg-graphite lg:block">
        <div className="sticky top-0 max-h-screen overflow-y-auto">
          <div className="border-b border-steel-line px-5 py-4">
            <Wordmark className="!text-lg" />
          </div>
          <NavList />
          <div className="px-5 py-4">
            <Link
              href="/app"
              className="block rounded-lg bg-steel px-3 py-2 text-center text-sm text-muted ring-1 ring-steel-line transition hover:text-ink"
            >
              ← Voltar ao app
            </Link>
          </div>
        </div>
      </aside>

      {/* Drawer mobile */}
      {aberto && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setAberto(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 overflow-y-auto border-r border-steel-line bg-graphite">
            <div className="flex items-center justify-between border-b border-steel-line px-5 py-4">
              <Wordmark className="!text-lg" />
              <button
                onClick={() => setAberto(false)}
                className="text-muted"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>
            <NavList onNavigate={() => setAberto(false)} />
          </div>
        </div>
      )}
    </>
  );
}
