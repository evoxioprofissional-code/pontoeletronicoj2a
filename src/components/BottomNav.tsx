"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { HomeIcon, CalendarIcon, Fingerprint } from "@/components/icons";

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const baterPonto = () => {
    if (pathname === "/app") {
      window.dispatchEvent(new CustomEvent("j2a:bater"));
    } else {
      router.push("/app");
    }
  };

  const cor = (ativo: boolean) => (ativo ? "text-amber" : "text-muted");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-md items-end justify-around border-t border-steel-line bg-graphite/95 px-6 pb-3 pt-2 backdrop-blur">
      <Link
        href="/app"
        className={`flex flex-1 flex-col items-center gap-1 text-[11px] ${cor(
          pathname === "/app",
        )}`}
      >
        <HomeIcon className="h-6 w-6" />
        Início
      </Link>

      {/* Botão central */}
      <button
        onClick={baterPonto}
        className="relative -mt-6 flex flex-col items-center"
        aria-label="Bater ponto"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-amber text-graphite shadow-amber-glow ring-4 ring-graphite">
          <Fingerprint className="h-8 w-8" />
        </span>
        <span className="mt-1 text-[11px] font-semibold text-amber">
          Bater ponto
        </span>
      </button>

      <Link
        href="/app/registros"
        className={`flex flex-1 flex-col items-center gap-1 text-[11px] ${cor(
          pathname.startsWith("/app/registros"),
        )}`}
      >
        <CalendarIcon className="h-6 w-6" />
        Registros
      </Link>
    </nav>
  );
}
