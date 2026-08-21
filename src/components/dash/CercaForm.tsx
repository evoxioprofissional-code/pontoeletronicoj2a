"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { salvarCerca, geocodificar, type CercaState } from "@/app/admin/cerca/actions";
import { PinIcon, AlertIcon, CheckIcon } from "@/components/icons";

interface CercaInit {
  nome: string;
  endereco: string;
  latitude: number;
  longitude: number;
  raio_metros: number;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-amber px-5 py-2.5 text-sm font-semibold text-graphite transition hover:bg-amber-soft disabled:opacity-60"
    >
      {pending ? "Salvando…" : "Salvar cerca"}
    </button>
  );
}

const campo =
  "w-full rounded-lg border border-steel-line bg-graphite px-3 py-2 text-ink placeholder:text-muted focus:border-amber focus:outline-none";

export function CercaForm({ init }: { init: CercaInit | null }) {
  const [state, formAction] = useFormState<CercaState, FormData>(salvarCerca, {});
  const [nome, setNome] = useState(init?.nome ?? "Fábrica");
  const [endereco, setEndereco] = useState(init?.endereco ?? "");
  const [lat, setLat] = useState(init ? String(init.latitude) : "");
  const [lng, setLng] = useState(init ? String(init.longitude) : "");
  const [raio, setRaio] = useState(String(init?.raio_metros ?? 150));

  const [geoMsg, setGeoMsg] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [localizando, setLocalizando] = useState(false);

  function usarLocalizacao() {
    setGeoMsg(null);
    if (!navigator.geolocation) {
      setGeoMsg("Geolocalização indisponível neste dispositivo.");
      return;
    }
    setLocalizando(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setLocalizando(false);
      },
      () => {
        setGeoMsg("Não foi possível obter sua localização.");
        setLocalizando(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  async function buscarEndereco() {
    setGeoMsg(null);
    setBuscando(true);
    const r = await geocodificar(endereco);
    setBuscando(false);
    if ("error" in r) {
      setGeoMsg(r.error);
      return;
    }
    setLat(r.lat.toFixed(6));
    setLng(r.lng.toFixed(6));
    setEndereco(r.display);
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
          Nome do local
        </span>
        <input
          name="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className={campo}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
          Endereço
        </span>
        <div className="flex gap-2">
          <input
            name="endereco"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            placeholder="Rua, número, cidade/UF"
            className={campo}
          />
          <button
            type="button"
            onClick={buscarEndereco}
            disabled={buscando}
            className="shrink-0 rounded-lg bg-steel px-3 py-2 text-sm font-semibold text-amber ring-1 ring-amber/40 disabled:opacity-60"
          >
            {buscando ? "…" : "Buscar"}
          </button>
        </div>
      </label>

      <button
        type="button"
        onClick={usarLocalizacao}
        disabled={localizando}
        className="flex items-center justify-center gap-2 rounded-lg bg-steel px-3 py-2.5 text-sm font-semibold text-ink ring-1 ring-steel-line disabled:opacity-60"
      >
        <PinIcon className="h-4 w-4 text-amber" />
        {localizando ? "Localizando…" : "Usar minha localização atual"}
      </button>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Latitude
          </span>
          <input
            name="latitude"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            inputMode="decimal"
            className={`${campo} font-mono`}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Longitude
          </span>
          <input
            name="longitude"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            inputMode="decimal"
            className={`${campo} font-mono`}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
          Raio permitido (metros)
        </span>
        <input
          name="raio_metros"
          value={raio}
          onChange={(e) => setRaio(e.target.value)}
          type="number"
          min={20}
          className={`${campo} font-mono`}
        />
      </label>

      {lat && lng && (
        <a
          href={`https://www.google.com/maps?q=${lat},${lng}`}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-amber underline"
        >
          Ver no mapa
        </a>
      )}

      {geoMsg && (
        <p className="flex items-center gap-2 text-sm text-danger">
          <AlertIcon className="h-4 w-4" /> {geoMsg}
        </p>
      )}
      {state.error && (
        <p className="flex items-center gap-2 text-sm text-danger">
          <AlertIcon className="h-4 w-4" /> {state.error}
        </p>
      )}
      {state.ok && (
        <p className="flex items-center gap-2 text-sm text-signal">
          <CheckIcon className="h-4 w-4" /> Cerca salva!
        </p>
      )}

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
