import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "@/components/icons";
import { Marca } from "@/components/Logo";
import { botao } from "@/components/ui";
import { AssistenteInstalacao } from "./AssistenteInstalacao";

export const metadata: Metadata = {
  title: "Instalar no celular | j2aponto",
  description: "Instale o j2aponto na tela inicial do seu Android ou iPhone.",
};

export default function InstalarPage() {
  return (
    <main className="app-gutter mx-auto min-h-dvh max-w-lg pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-x-4">
        <Marca />
        <Link href="/" className={botao("texto", "md", "!px-0")}>
          <ArrowLeft className="h-4 w-4" />
          Voltar ao j2aponto
        </Link>
      </header>
      <AssistenteInstalacao />
    </main>
  );
}
