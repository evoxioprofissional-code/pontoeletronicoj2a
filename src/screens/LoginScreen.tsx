"use client";

import { useState } from "react";
import { usePrototype } from "@/lib/prototype";
import { LogoMark, Wordmark } from "@/components/Logo";
import { Button, ScreenShell } from "@/components/ui";
import { EMPLOYEE } from "@/lib/mock-data";

export function LoginScreen() {
  const { dispatch } = usePrototype();
  const [registration, setRegistration] = useState("04871");
  const [password, setPassword] = useState("••••••");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    dispatch({ type: "GO", screen: "home" });
  }

  return (
    <ScreenShell className="justify-center">
      <div className="flex flex-col items-center pb-10 pt-4">
        <LogoMark size={56} />
        <Wordmark className="mt-3" />
        <p className="mt-1 text-sm text-muted">Registro de ponto</p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Matrícula
          </span>
          <input
            inputMode="numeric"
            value={registration}
            onChange={(e) => setRegistration(e.target.value)}
            className="w-full rounded-xl border border-steel-line bg-steel px-4 py-3.5 font-mono text-lg text-ink placeholder:text-muted focus:border-amber focus:outline-none"
            placeholder="00000"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Senha
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-steel-line bg-steel px-4 py-3.5 font-mono text-lg text-ink placeholder:text-muted focus:border-amber focus:outline-none"
            placeholder="••••••"
          />
        </label>

        <Button type="submit" className="mt-2">
          Entrar
        </Button>
      </form>

      <p className="mt-auto pt-10 text-center text-xs text-muted">
        {EMPLOYEE.company}
        <br />
        <span className="text-muted/60">Controle de jornada · j2aponto</span>
      </p>
    </ScreenShell>
  );
}
