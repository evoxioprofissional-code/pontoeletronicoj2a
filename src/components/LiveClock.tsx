"use client";

import { useClock } from "@/lib/useClock";
import {
  minutosTrabalhados,
  formatarMinutos,
  type MarcacaoLite,
} from "@/lib/ponto";
import { Progresso } from "./ui";

const DATA_LONGA = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const p2 = (n: number) => String(n).padStart(2, "0");

/** Relógio grande: horas e minutos em destaque, segundos menores. */
export function LiveClock() {
  const now = useClock();
  return (
    <p
      className="num flex items-baseline justify-center font-medium leading-none text-ink"
      aria-label="Horário atual"
    >
      <span className="text-[clamp(2.75rem,13vw,3.75rem)] sm:text-[4.5rem]">
        {now ? `${p2(now.getHours())}:${p2(now.getMinutes())}` : "--:--"}
      </span>
      <span className="ml-1 w-[2.4ch] text-left text-2xl text-ink-3 sm:text-3xl">
        {now ? `:${p2(now.getSeconds())}` : ""}
      </span>
    </p>
  );
}

/** "terça-feira, 10 de novembro" — no horário do aparelho. */
export function DataExtenso() {
  const now = useClock();
  if (!now) return <span className="invisible">carregando data</span>;
  const s = DATA_LONGA.format(now);
  return <span>{s.charAt(0).toUpperCase() + s.slice(1)}</span>;
}

/** Saudação conforme a hora do aparelho. */
export function Saudacao({ nome }: { nome: string }) {
  const now = useClock();
  const h = now?.getHours();
  const texto =
    h == null ? "Olá" : h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  // Como no Haus Coach: o nome vem em coral, com ponto final.
  return (
    <>
      {texto}, <span className="text-brand">{nome}.</span>
    </>
  );
}

/** Horas trabalhadas hoje — atualiza sozinho enquanto a pessoa está em turno. */
export function HorasHoje({
  marcacoes,
  cargaMin,
  inicialMin,
}: {
  marcacoes: MarcacaoLite[];
  cargaMin: number;
  /** Valor calculado no servidor, usado até o relógio do aparelho iniciar. */
  inicialMin: number;
}) {
  const now = useClock();
  const trabalhado = now ? minutosTrabalhados(marcacoes, now) : inicialMin;
  const falta = Math.max(0, cargaMin - trabalhado);
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="num text-2xl font-medium text-ink">
          {formatarMinutos(trabalhado)}
        </p>
        <p className="text-sm text-ink-3">
          de <span className="num">{formatarMinutos(cargaMin)}</span>
        </p>
      </div>
      <Progresso
        valor={trabalhado}
        total={cargaMin}
        rotulo="Horas trabalhadas hoje"
      />
      <p className="mt-2 text-sm text-ink-3">
        {trabalhado === 0
          ? "Sua jornada de hoje ainda não começou."
          : falta > 0
            ? `Faltam ${formatarMinutos(falta)} para completar a jornada.`
            : "Jornada do dia completa."}
      </p>
    </div>
  );
}

/**
 * Relógio dentro de um anel que enche conforme as horas do dia — a peça
 * central da tela inicial. Feito para o cartão escuro (texto branco).
 */
export function RelogioAnel({
  marcacoes,
  cargaMin,
  inicialMin,
}: {
  marcacoes: MarcacaoLite[];
  cargaMin: number;
  inicialMin: number;
}) {
  const now = useClock();
  const trabalhado = now ? minutosTrabalhados(marcacoes, now) : inicialMin;
  const pct = cargaMin > 0 ? Math.min(1, trabalhado / cargaMin) : 0;
  const R = 46;
  const C = 2 * Math.PI * R;
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[16rem] rounded-full bg-[#0A1012]/70">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={R} fill="none" stroke="#22313A" strokeWidth="4" />
        <circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          stroke={pct >= 1 ? "#7DDBA3" : "#2BB3C0"}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - pct)}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.2,0.8,0.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <p className="num flex items-baseline font-extrabold leading-none tracking-[-0.045em]" aria-label="Horário atual">
          <span className="text-[clamp(3rem,15vw,4.25rem)]">
            {now ? `${p2(now.getHours())}:${p2(now.getMinutes())}` : "--:--"}
          </span>
          <span className="ml-0.5 w-[2.2ch] text-left text-xl font-bold text-[#8FA6AB]">
            {now ? p2(now.getSeconds()) : ""}
          </span>
        </p>
        <p className="mt-2 text-[0.8125rem] font-semibold text-[#8FA6AB]">
          <span className="num text-white">{formatarMinutos(trabalhado)}</span> de{" "}
          <span className="num">{formatarMinutos(cargaMin)}</span>
        </p>
      </div>
    </div>
  );
}
