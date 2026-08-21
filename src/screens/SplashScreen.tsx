"use client";

import { useEffect } from "react";
import { usePrototype } from "@/lib/prototype";
import { LogoMark, Wordmark } from "@/components/Logo";
import { EMPLOYEE } from "@/lib/mock-data";

export function SplashScreen() {
  const { dispatch } = usePrototype();

  // Transição automática para o login após ~1.6s (toque para pular).
  useEffect(() => {
    const id = setTimeout(() => dispatch({ type: "GO", screen: "login" }), 1600);
    return () => clearTimeout(id);
  }, [dispatch]);

  return (
    <button
      onClick={() => dispatch({ type: "GO", screen: "login" })}
      className="flex min-h-full w-full flex-col items-center justify-center gap-6 px-8 text-center"
      aria-label="Pular introdução"
    >
      <div className="animate-fade-up">
        <LogoMark size={76} />
      </div>
      <Wordmark className="animate-fade-up !text-3xl" />

      {/* Loader discreto: pulso âmbar */}
      <div className="mt-4 flex items-center gap-2" aria-hidden>
        <span className="h-2 w-2 rounded-full bg-amber animate-amber-pulse [animation-delay:0ms]" />
        <span className="h-2 w-2 rounded-full bg-amber animate-amber-pulse [animation-delay:200ms]" />
        <span className="h-2 w-2 rounded-full bg-amber animate-amber-pulse [animation-delay:400ms]" />
      </div>

      <p className="absolute bottom-10 text-xs text-muted">
        {EMPLOYEE.company}
      </p>
    </button>
  );
}
