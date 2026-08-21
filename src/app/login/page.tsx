"use client";

import { useFormState, useFormStatus } from "react-dom";
import { entrar, type LoginState } from "./actions";
import { LogoMark, Wordmark } from "@/components/Logo";
import { AlertIcon } from "@/components/icons";
import { EMPLOYEE } from "@/lib/mock-data";

const initial: LoginState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 inline-flex w-full items-center justify-center rounded-2xl bg-amber px-5 py-4 text-base font-semibold text-graphite shadow-amber-glow transition hover:bg-amber-soft active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-steel disabled:text-muted disabled:shadow-none"
    >
      {pending ? "Entrando…" : "Entrar"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(entrar, initial);

  return (
    <main className="stage-bg flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center pb-8">
          <LogoMark size={60} />
          <Wordmark className="mt-3 !text-2xl" />
          <p className="mt-1 text-sm text-muted">Registro de ponto</p>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              E-mail
            </span>
            <input
              name="email"
              type="email"
              inputMode="email"
              autoComplete="username"
              required
              className="w-full rounded-xl border border-steel-line bg-steel px-4 py-3.5 text-lg text-ink placeholder:text-muted focus:border-amber focus:outline-none"
              placeholder="voce@empresa.com"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              Senha
            </span>
            <input
              name="senha"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-steel-line bg-steel px-4 py-3.5 font-mono text-lg text-ink placeholder:text-muted focus:border-amber focus:outline-none"
              placeholder="••••••"
            />
          </label>

          {state.error && (
            <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-3 text-sm text-danger">
              <AlertIcon className="h-5 w-5 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          <SubmitButton />
        </form>

        <p className="mt-10 text-center text-xs text-muted">
          {EMPLOYEE.company}
          <br />
          <span className="text-muted/60">Controle de jornada · j2aponto</span>
        </p>
      </div>
    </main>
  );
}
