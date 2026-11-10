import { Marca } from "@/components/Logo";
import { botao } from "@/components/ui";
import { sair } from "@/app/app/actions";

/** Conta logada que ainda não foi ligada a um funcionário pelo RH. */
export function SemVinculo() {
  return (
    <main className="app-gutter flex min-h-dvh flex-col items-center justify-center bg-paper pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] text-center">
      <Marca className="mb-8" />
      <h1 className="text-xl font-semibold text-ink">
        Sua conta ainda não está liberada
      </h1>
      <p className="mt-2 max-w-sm text-[0.9375rem] leading-relaxed text-ink-2">
        O login funcionou, mas o RH ainda não vinculou esta conta a um
        funcionário. Fale com o RH da sua empresa.
      </p>
      <form action={sair} className="mt-6">
        <button type="submit" className={botao("secundario")}>
          Sair e entrar com outra conta
        </button>
      </form>
    </main>
  );
}
