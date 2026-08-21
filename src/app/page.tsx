"use client";

import { PrototypeProvider } from "@/lib/prototype";
import { PhoneFrame } from "@/components/PhoneFrame";
import { ScreenRouter } from "@/components/ScreenRouter";
import { PrototypeControls } from "@/components/PrototypeControls";
import { DebugPanel } from "@/components/DebugPanel";
import { Wordmark } from "@/components/Logo";

export default function Page() {
  return (
    <PrototypeProvider>
      <main className="stage-bg flex min-h-screen flex-col items-center gap-8 px-4 py-10">
        {/* Cabeçalho do palco de apresentação */}
        <header className="text-center">
          <div className="mb-1 flex items-center justify-center gap-2">
            <Wordmark className="!text-xl" />
            <span className="rounded-full bg-steel px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-amber ring-1 ring-steel-line">
              Protótipo
            </span>
          </div>
          <p className="text-sm text-muted">
            Mockup visual do app de ponto eletrônico · para validação de design
          </p>
        </header>

        {/* Palco: celular + controles */}
        <div className="flex flex-col items-center justify-center gap-10 lg:flex-row lg:items-start">
          {/* Coluna do celular + navegação do protótipo */}
          <div className="flex flex-col items-center gap-6">
            <PhoneFrame>
              <ScreenRouter />
            </PhoneFrame>
            <PrototypeControls />
          </div>

          {/* Coluna de controles de demonstração */}
          <aside className="flex w-full max-w-[300px] flex-col gap-4">
            <DebugPanel />
            <div className="rounded-2xl border border-steel-line bg-steel/50 p-4 text-xs leading-relaxed text-muted">
              <p className="mb-1 font-semibold text-ink">Roteiro sugerido</p>
              <p>
                Splash → Login → Home. Na Home, alterne{" "}
                <span className="text-danger">Fora</span> para ver o botão
                bloqueado. Volte para{" "}
                <span className="text-signal">Dentro</span>, toque em{" "}
                <span className="text-amber">Bater Ponto</span> e demonstre a
                captura em <span className="text-signal">Sucesso</span> e{" "}
                <span className="text-danger">Falha</span>.
              </p>
            </div>
          </aside>
        </div>

        <footer className="pt-2 text-center text-xs text-muted/70">
          Protótipo não funcional · sem backend, câmera ou GPS reais · j2aponto
        </footer>
      </main>
    </PrototypeProvider>
  );
}
