import type { SVGProps } from "react";
import type { TipoDB } from "@/lib/ponto";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function ArrowLeft(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

export function ArrowRight(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
      <path d="M10 18.5h4" />
    </svg>
  );
}

export function MoreVerticalIcon(props: IconProps) {
  return (
    <svg {...base} {...props} stroke="none" fill="currentColor">
      <circle cx="12" cy="5" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="12" cy="19" r="1.75" />
    </svg>
  );
}

export function ShareIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 15V2m-4 4 4-4 4 4M8 9H5v13h14V9h-3" />
    </svg>
  );
}

export function EnterIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M14 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4" />
      <path d="M9 16l4-4-4-4" />
      <path d="M13 12H4" />
    </svg>
  );
}

export function ExitIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M10 4H6a1 1 0 00-1 1v14a1 1 0 001 1h4" />
      <path d="M15 16l4-4-4-4" />
      <path d="M19 12h-9" />
    </svg>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 6v12" />
      <path d="M15 6v12" />
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 6l10 6-10 6V6z" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4l9 16H3L12 4z" />
      <path d="M12 10v4" />
      <path d="M12 17.2v.3" />
    </svg>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21s7-6.2 7-11.5A7 7 0 005 9.500C5 14.800 12 21 12 21z" />
      <circle cx="12" cy="9.500" r="2.500" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.500" />
      <path d="M12 7.500V12l3 2" />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8.500" r="3.500" />
      <path d="M5 20c.8-3.500 3.600-5.500 7-5.500s6.200 2 7 5.500" />
    </svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="9" r="3" />
      <path d="M3 19c.6-3 2.900-4.800 6-4.800s5.400 1.800 6 4.800" />
      <path d="M16 6.200a3 3 0 010 5.600" />
      <path d="M17.500 14.500c1.900.5 3.100 2 3.500 4.500" />
    </svg>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M10 4H6a1 1 0 00-1 1v14a1 1 0 001 1h4" />
      <path d="M15 16l4-4-4-4" />
      <path d="M19 12h-9" />
    </svg>
  );
}

export function ScanFaceIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 8V6a2 2 0 012-2h2" />
      <path d="M16 4h2a2 2 0 012 2v2" />
      <path d="M20 16v2a2 2 0 01-2 2h-2" />
      <path d="M8 20H6a2 2 0 01-2-2v-2" />
      <path d="M9 10v1" />
      <path d="M15 10v1" />
      <path d="M9.500 15c.7.600 1.500.900 2.500.900s1.800-.300 2.500-.900" />
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 11l8-6.500 8 6.500" />
      <path d="M6 10v9h12v-9" />
    </svg>
  );
}

export function ListIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 7h11" />
      <path d="M8 12h11" />
      <path d="M8 17h11" />
      <path d="M4.500 7h.01" />
      <path d="M4.500 12h.01" />
      <path d="M4.500 17h.01" />
    </svg>
  );
}

export function ChartIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 20V10" />
      <path d="M12 20V4" />
      <path d="M19 20v-7" />
    </svg>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M2.500 12S6 5.500 12 5.500 21.500 12 21.500 12 18 18.500 12 18.500 2.500 12 2.500 12z" />
      <circle cx="12" cy="12" r="2.500" />
    </svg>
  );
}

export function EyeOffIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 4l16 16" />
      <path d="M9.900 5.800A9 9 0 0112 5.500c6 0 9.500 6.500 9.500 6.500a15 15 0 01-2.700 3.400" />
      <path d="M6.300 7.700A15 15 0 002.500 12S6 18.500 12 18.500a9 9 0 003.400-.700" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

export function ExternalIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M14 5h5v5" />
      <path d="M19 5l-8 8" />
      <path d="M18 14v4a1 1 0 01-1 1H6a1 1 0 01-1-1V7a1 1 0 011-1h4" />
    </svg>
  );
}

const TIPO_ICON: Record<TipoDB, (p: IconProps) => JSX.Element> = {
  entrada: EnterIcon,
  inicio_intervalo: PauseIcon,
  fim_intervalo: PlayIcon,
  saida: ExitIcon,
};

/** Ícone de cada tipo de marcação. */
export function TipoIcon({ tipo, ...props }: { tipo: TipoDB } & IconProps) {
  const Cmp = TIPO_ICON[tipo];
  return <Cmp {...props} />;
}
