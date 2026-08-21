import { ShieldIcon } from "@/components/icons";

export default function EmBreve({
  searchParams,
}: {
  searchParams: { secao?: string };
}) {
  const secao = searchParams.secao ?? "Este módulo";
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-steel text-amber ring-1 ring-steel-line">
        <ShieldIcon className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-semibold text-ink">{secao}</h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        Este módulo faz parte do roadmap do painel e será construído nas próximas
        fases. A estrutura do menu já está pronta para recebê-lo.
      </p>
      <span className="mt-5 rounded-full bg-amber/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber ring-1 ring-amber/30">
        Em breve
      </span>
    </div>
  );
}
