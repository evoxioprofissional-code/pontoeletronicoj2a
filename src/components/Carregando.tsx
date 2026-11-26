// Esqueletos de carregamento: aparecem na hora ao trocar de tela, enquanto o
// servidor monta a página. Sem isso o toque parecia "não fazer nada".

function Bloco({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-card bg-line/60 ${className}`} />;
}

/** App do funcionário: barra do topo + conteúdo + barra de abas. */
export function CarregandoApp() {
  return (
    <div className="min-h-dvh bg-paper" aria-busy="true" aria-label="Carregando">
      <div className="vidro safe-t sticky top-0 z-30 border-b border-line">
        <div className="app-gutter mx-auto flex h-[3.25rem] max-w-5xl items-center justify-between md:h-16">
          <div className="h-8 w-32 animate-pulse rounded-lg bg-line/70" />
          <div className="h-8 w-8 animate-pulse rounded-full bg-line/70" />
        </div>
      </div>
      <div className="app-gutter mx-auto max-w-5xl pt-5 md:pt-10">
        <div className="mb-2 h-4 w-40 animate-pulse rounded bg-line/70" />
        <div className="mb-6 h-9 w-64 animate-pulse rounded-lg bg-line/70" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Bloco className="h-[30rem]" />
          <div className="flex flex-col gap-6">
            <Bloco className="h-64" />
            <Bloco className="h-44" />
          </div>
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 h-[4.5rem] rounded-t-[22px] border border-b-0 border-line bg-surface md:hidden" />
    </div>
  );
}

/** Painel do RH: só a área de conteúdo (a barra lateral já está na tela). */
export function CarregandoPainel() {
  return (
    <div aria-busy="true" aria-label="Carregando">
      <div className="mb-7 h-10 w-56 animate-pulse rounded-lg bg-line/70" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Bloco key={i} className="h-32" />
        ))}
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-12">
        <Bloco className="h-96 xl:col-span-8" />
        <Bloco className="h-96 xl:col-span-4" />
      </div>
    </div>
  );
}
