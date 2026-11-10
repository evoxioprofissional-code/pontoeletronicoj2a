"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { entrar, type LoginState } from "./actions";
import { Marca } from "@/components/Logo";
import { Aviso, Campo, botao } from "@/components/ui";
import { EyeIcon, EyeOffIcon } from "@/components/icons";

const initial: LoginState = {};

function Entrar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={botao("primario", "lg", "mt-1 w-full")}
    >
      {pending ? "Entrando…" : "Entrar"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(entrar, initial);
  const [verSenha, setVerSenha] = useState(false);

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Painel da marca — só em telas largas */}
      <aside className="hidden flex-col justify-between bg-brand px-12 py-10 lg:flex">
        <Marca invertido />
        <div className="max-w-md">
          <p className="text-[2.5rem] font-semibold leading-[1.1] tracking-tight text-white">
            Seu ponto, registrado na hora certa e no lugar certo.
          </p>
          <ul className="mt-8 space-y-3 text-[0.9375rem] text-white/80">
            <li className="flex gap-3">
              <span className="num text-white/50">01</span>
              Confirma que é você pelo rosto.
            </li>
            <li className="flex gap-3">
              <span className="num text-white/50">02</span>
              Confirma que você está na fábrica pelo GPS.
            </li>
            <li className="flex gap-3">
              <span className="num text-white/50">03</span>
              Guarda cada marcação com data, hora e local.
            </li>
          </ul>
        </div>
        <p className="text-sm text-white/50">Controle de jornada</p>
      </aside>

      {/* Formulário */}
      <main className="flex flex-col justify-center bg-paper px-5 py-10 sm:px-8">
        <div className="mx-auto w-full max-w-sm">
          <Marca className="mb-10 lg:hidden" />

          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Entrar
          </h1>
          <p className="mt-1 text-[0.9375rem] text-ink-2">
            Use o e-mail e a senha que o RH passou para você.
          </p>

          <form action={formAction} className="mt-7 flex flex-col gap-4">
            <Campo rotulo="E-mail">
              <input
                name="email"
                type="email"
                inputMode="email"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                className="campo min-h-[3rem]"
                placeholder="nome@empresa.com"
              />
            </Campo>

            <Campo rotulo="Senha">
              <div className="relative">
                <input
                  name="senha"
                  type={verSenha ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="campo min-h-[3rem] pr-12"
                />
                <button
                  type="button"
                  onClick={() => setVerSenha((v) => !v)}
                  aria-label={verSenha ? "Esconder senha" : "Mostrar senha"}
                  aria-pressed={verSenha}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-lg text-ink-3 hover:text-ink"
                >
                  {verSenha ? (
                    <EyeOffIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </Campo>

            {state.error && <Aviso tom="erro">{state.error}</Aviso>}

            <Entrar />
          </form>

          <p className="mt-8 text-sm leading-relaxed text-ink-3">
            Esqueceu a senha ou é seu primeiro acesso? Procure o RH da sua
            empresa.
          </p>
        </div>
      </main>
    </div>
  );
}
