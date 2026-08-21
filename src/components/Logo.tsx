/** Marca do app — um "carimbo" com relógio, reforçando a metáfora do ponto. */
export function LogoMark({ size = 64 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
    >
      <rect
        x="4"
        y="4"
        width="56"
        height="56"
        rx="16"
        fill="#1E232B"
        stroke="#F5A623"
        strokeWidth="2.5"
      />
      <circle
        cx="32"
        cy="32"
        r="16"
        stroke="#F5A623"
        strokeWidth="2.5"
      />
      <path
        d="M32 22v10l7 4"
        stroke="#EDEFF2"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-mono text-2xl font-bold tracking-tight text-ink ${className}`}
    >
      j2a<span className="text-amber">ponto</span>
    </span>
  );
}
