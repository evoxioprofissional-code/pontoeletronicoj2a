import type { SVGProps } from "react";
import type { PunchType } from "@/lib/types";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function ArrowLeft(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

export function ArrowRight(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function EnterIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M15 3h4a1 1 0 011 1v16a1 1 0 01-1 1h-4" />
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
    </svg>
  );
}

export function ExitIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M9 3H5a1 1 0 00-1 1v16a1 1 0 001 1h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <rect x="7" y="5" width="4" height="14" rx="1" />
      <rect x="13" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M7 5l12 7-12 7V5z" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
    </svg>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1116 0z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0116 0" />
    </svg>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M9 21H5a1 1 0 01-1-1V4a1 1 0 011-1h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

export function ScanFaceIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M4 8V6a2 2 0 012-2h2M16 4h2a2 2 0 012 2v2M20 16v2a2 2 0 01-2 2h-2M8 20H6a2 2 0 01-2-2v-2" />
      <path d="M9 10h.01M15 10h.01M12 10v3l-1 1M9.5 15c.8.7 1.6 1 2.5 1s1.7-.3 2.5-1" />
    </svg>
  );
}

const PUNCH_ICON: Record<PunchType, (p: IconProps) => JSX.Element> = {
  Entrada: EnterIcon,
  "Início Intervalo": PauseIcon,
  "Fim Intervalo": PlayIcon,
  Saída: ExitIcon,
};

export function PunchIcon({ type, ...props }: { type: PunchType } & IconProps) {
  const Cmp = PUNCH_ICON[type];
  return <Cmp {...props} />;
}
