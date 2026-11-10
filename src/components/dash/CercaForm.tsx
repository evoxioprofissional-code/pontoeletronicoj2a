"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  salvarCerca,
  geocodificar,
  type CercaState,
} from "@/app/admin/cerca/actions";
import { Aviso, Campo, botao } from "@/components/ui";
import { ExternalIcon, PinIcon } from "@/components/icons";

export interface CercaInit {
  nome: string;
  endereco: string;
  latitude: number;
  longitude: number;
  raio_metros: number;
}

function Salvar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={botao("primario")}>
      {pending ? "Salvando…" : "Salvar local"}
    </button>
  );
}

export function CercaForm({ init }: { init: CercaInit | null }) {
  const [state, formAction] = useFormState<CercaState, FormData>(salvarCerca, {});
  const [nome, setNome] = useState(init?.nome ?? "Fábrica");
  const [endereco, setEndereco] = useState(init?.endereco ?? "");
  const [lat, setLat] = useState(init ? String(init.latitude) : "");
  const [lng, setLng] = useState(init ? String(init.longitude) : "");
  const [raio, setRaio] = useState(String(init?.raio_metros ?? 150));

  const [geoMsg, setGeoMsg] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ tom: "ok" | "aviso"; texto: string } | null>(
    null,
  );
  const [buscando, setBuscando] = useState(false);
  const [localizando, setLocalizando] = useState(false);

  function usarLocalizacao() {
    setGeoMsg(null);
    setAviso(null);
    if (!navigator.geolocation) {
      setGeoMsg("Este aparelho não informa a localização.");
      return;
    }
    setLocalizando(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setAviso({
          tom: "ok",
          texto: `Localização capturada, com precisão de ±${Math.round(pos.coords.accuracy)} m. Confira no mapa e salve.`,
        });
        setLocalizando(false);
      },
      () => {
        setGeoMsg(
          "Não foi possível obter sua localização. Permita o acesso à localização no navegador e tente de novo.",
        );
        setLocalizando(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  async function buscarEndereco() {
    setGeoMsg(null);
    setAviso(null);
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
    setAviso({
      tom: "aviso",
      texto:
        "A busca por endereço é aproximada e pode errar por centenas de metros. Confira no mapa antes de salvar.",
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Campo rotulo="Nome do local">
        <input
          name="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="campo"
        />
      </Campo>

      {/* Onde fica */}
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 text-[0.9375rem] font-semibold text-ink">
          Onde fica
        </legend>

        <div className="rounded-lg border border-brand-line bg-brand-tint p-4">
          <p className="text-sm text-ink-2">
            <strong className="font-semibold text-ink">
              Jeito mais preciso:
            </strong>{" "}
            abra esta tela no celular, de dentro da fábrica, e use o botão
            abaixo.
          </p>
          <button
            type="button"
            onClick={usarLocalizacao}
            disabled={localizando}
            className={botao("primario", "md", "mt-3 w-full sm:w-auto")}
          >
            <PinIcon className="h-[1.125rem] w-[1.125rem]" />
            {localizando ? "Localizando…" : "Usar minha localização atual"}
          </button>
        </div>

        <Campo rotulo="Ou busque pelo endereço">
          <div className="flex gap-2">
            <input
              name="endereco"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Rua, número, cidade/UF"
              className="campo"
            />
            <button
              type="button"
              onClick={buscarEndereco}
              disabled={buscando}
              className={botao("secundario", "md", "shrink-0")}
            >
              {buscando ? "Buscando…" : "Buscar"}
            </button>
          </div>
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Latitude">
            <input
              name="latitude"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              inputMode="decimal"
              className="campo num"
            />
          </Campo>
          <Campo rotulo="Longitude">
            <input
              name="longitude"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              inputMode="decimal"
              className="campo num"
            />
          </Campo>
        </div>

        {lat && lng && (
          <a
            href={`https://www.google.com/maps?q=${lat},${lng}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-brand underline underline-offset-4"
          >
            Conferir este ponto no mapa
            <ExternalIcon className="h-4 w-4" />
          </a>
        )}

        {aviso && <Aviso tom={aviso.tom}>{aviso.texto}</Aviso>}
        {geoMsg && <Aviso tom="erro">{geoMsg}</Aviso>}
      </fieldset>

      <Campo
        rotulo="Raio permitido"
        dica="Distância máxima do ponto acima em que o funcionário consegue registrar. Para um galpão, 100 a 150 m costuma funcionar bem."
      >
        <div className="flex items-center gap-2">
          <input
            name="raio_metros"
            value={raio}
            onChange={(e) => setRaio(e.target.value)}
            type="number"
            inputMode="numeric"
            min={20}
            className="campo num w-28"
          />
          <span className="text-sm text-ink-3">metros</span>
        </div>
      </Campo>

      <div className="flex flex-col gap-3 border-t border-line pt-5">
        {state.error && <Aviso tom="erro">{state.error}</Aviso>}
        {state.ok && <Aviso tom="ok">Local salvo.</Aviso>}
        <div className="flex justify-end">
          <Salvar />
        </div>
      </div>
    </form>
  );
}
