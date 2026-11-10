import Link from "next/link";
import { ArrowLeft, ArrowRight } from "./icons";
import { rotuloMes, somarMes } from "@/lib/banco";

const seta =
  "flex h-11 w-11 items-center justify-center rounded-lg border border-line-strong bg-surface text-ink transition-colors hover:border-ink-3";

/** Navegação de mês: ‹ Novembro de 2026 ›. Não avança além do mês atual. */
export function SeletorMes({
  mes,
  mesAtual,
  base,
}: {
  /** "AAAA-MM" mostrado. */
  mes: string;
  /** "AAAA-MM" de hoje. */
  mesAtual: string;
  /** Caminho da página, sem parâmetros. */
  base: string;
}) {
  const noLimite = mes >= mesAtual;
  return (
    <div className="flex items-center gap-2 print:hidden">
      <Link
        href={`${base}?mes=${somarMes(mes, -1)}`}
        className={seta}
        aria-label="Mês anterior"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <p className="min-w-[10.5rem] text-center font-semibold text-ink">
        {rotuloMes(mes)}
      </p>
      {noLimite ? (
        <span aria-hidden className={`${seta} pointer-events-none opacity-30`}>
          <ArrowRight className="h-5 w-5" />
        </span>
      ) : (
        <Link
          href={`${base}?mes=${somarMes(mes, 1)}`}
          className={seta}
          aria-label="Próximo mês"
        >
          <ArrowRight className="h-5 w-5" />
        </Link>
      )}
    </div>
  );
}
