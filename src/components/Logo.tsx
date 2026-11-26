import { useId } from "react";

/**
 * Ícone do j2aponto: mostrador de relógio com um "check" no lugar dos
 * ponteiros — ponto registrado. Azul-petróleo em degradê.
 */
export function LogoMark({
  size = 32,
  invertido = false,
}: {
  size?: number;
  invertido?: boolean;
}) {
  const id = `j2a-${useId().replace(/:/g, "")}`;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <defs>
        <linearGradient id={id} x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#14A3B2" />
          <stop offset="1" stopColor="#075C66" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={invertido ? "#FFFFFF" : `url(#${id})`} />
      {/* mostrador: arco aberto no topo direito, como um relógio "em movimento" */}
      <path
        d="M22.6 9.4A9 9 0 1 0 25 16"
        stroke={invertido ? "#0B7F8C" : "#FFFFFF"}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M11.6 16.2l3.2 3.2 7.6-7.8"
        stroke={invertido ? "#0B7F8C" : "#FFFFFF"}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Marca completa: ícone + "j2aponto". */
export function Marca({
  invertido = false,
  className = "",
}: {
  invertido?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark invertido={invertido} />
      <span
        className={`text-[1.1875rem] font-extrabold leading-none tracking-[-0.045em] ${
          invertido ? "text-white" : "text-ink"
        }`}
      >
        j2a<span className={invertido ? "text-[#7FD8E1]" : "text-brand"}>ponto</span>
      </span>
    </span>
  );
}
