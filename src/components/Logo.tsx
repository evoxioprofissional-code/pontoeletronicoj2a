/** Símbolo: ponteiros de relógio dentro de um quadrado — "bater o ponto". */
export function LogoMark({
  size = 28,
  invertido = false,
}: {
  size?: number;
  invertido?: boolean;
}) {
  const fundo = invertido ? "#FFFFFF" : "#0E4F5E";
  const traco = invertido ? "#0E4F5E" : "#FFFFFF";
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect width="32" height="32" rx="7" fill={fundo} />
      <path
        d="M16 8.500V16l5 3"
        stroke={traco}
        strokeWidth="2.600"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="24.500" r="1.400" fill={traco} />
    </svg>
  );
}

/** Marca completa: símbolo + nome. */
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
        className={`text-[1.0625rem] font-semibold tracking-tight ${
          invertido ? "text-white" : "text-ink"
        }`}
      >
        j2a<span className={invertido ? "text-white/70" : "text-brand"}>ponto</span>
      </span>
    </span>
  );
}
