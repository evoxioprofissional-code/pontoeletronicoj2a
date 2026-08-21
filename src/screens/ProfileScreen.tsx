"use client";

import { usePrototype } from "@/lib/prototype";
import { Button, ScreenShell, SectionLabel } from "@/components/ui";
import { ArrowLeft, LogoutIcon, ShieldIcon } from "@/components/icons";
import { EMPLOYEE, GEOFENCE } from "@/lib/mock-data";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-steel-line px-4 py-3.5 last:border-b-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}

export function ProfileScreen() {
  const { dispatch } = usePrototype();

  const initials = EMPLOYEE.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("");

  return (
    <ScreenShell>
      {/* Cabeçalho */}
      <header className="flex items-center gap-3 pt-4">
        <button
          onClick={() => dispatch({ type: "GO", screen: "home" })}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-steel text-ink ring-1 ring-steel-line"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-semibold text-ink">Perfil</h1>
      </header>

      {/* Identificação */}
      <section className="mt-5 flex items-center gap-4 rounded-2xl border border-steel-line bg-steel px-5 py-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-graphite font-mono text-2xl font-bold text-amber ring-1 ring-steel-line">
          {initials}
        </div>
        <div>
          <p className="text-lg font-semibold text-ink">{EMPLOYEE.name}</p>
          <p className="text-sm text-muted">{EMPLOYEE.role}</p>
          <p className="mt-0.5 font-mono text-sm text-amber">
            Matrícula {EMPLOYEE.registration}
          </p>
        </div>
      </section>

      {/* Dados */}
      <div className="mt-6">
        <SectionLabel>Dados do funcionário</SectionLabel>
        <div className="overflow-hidden rounded-2xl border border-steel-line bg-steel">
          <InfoRow label="Nome" value={EMPLOYEE.name} />
          <InfoRow label="Matrícula" value={EMPLOYEE.registration} />
          <InfoRow label="Empresa" value={EMPLOYEE.company} />
        </div>
      </div>

      {/* Cerca eletrônica (somente leitura) */}
      <div className="mt-6">
        <SectionLabel>Cerca eletrônica</SectionLabel>
        <div className="rounded-2xl border border-steel-line bg-steel p-4">
          <div className="mb-3 flex items-center gap-2 text-amber">
            <ShieldIcon className="h-5 w-5" />
            <span className="text-sm font-semibold">{GEOFENCE.siteName}</span>
          </div>
          <p className="text-sm text-muted">{GEOFENCE.address}</p>
          <div className="mt-3 flex items-center gap-2 border-t border-steel-line pt-3">
            <span className="text-sm text-muted">Raio permitido</span>
            <span className="ml-auto font-mono text-lg text-ink">
              {GEOFENCE.radiusMeters} m
            </span>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted">
          Configuração definida pela empresa · somente leitura
        </p>
      </div>

      {/* Logout */}
      <div className="mt-auto pt-8">
        <Button
          variant="danger"
          onClick={() => dispatch({ type: "LOGOUT" })}
        >
          <LogoutIcon className="h-5 w-5" />
          Sair da conta
        </Button>
      </div>
    </ScreenShell>
  );
}
