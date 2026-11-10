import { CabecalhoPagina } from "@/components/dash/AdminShell";
import { CercaForm, type CercaInit } from "@/components/dash/CercaForm";
import { Cartao } from "@/components/ui";

export function CercaView({ init }: { init: CercaInit | null }) {
  return (
    <>
      <CabecalhoPagina
        titulo="Local da fábrica"
        descricao="O funcionário só consegue registrar o ponto dentro desta área."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start lg:gap-6">
        <Cartao className="p-5 sm:p-6">
          <CercaForm init={init} />
        </Cartao>

        <aside className="text-sm leading-relaxed text-ink-2">
          <h2 className="mb-2 text-[0.9375rem] font-semibold text-ink">
            Como funciona
          </h2>
          <ul className="space-y-2.5">
            <li>
              O app mede a distância entre o celular do funcionário e o ponto
              que você definir aqui.
            </li>
            <li>
              Se a distância for menor que o raio, o botão de registrar é
              liberado.
            </li>
            <li>
              Dentro de galpões o GPS erra um pouco, então o app dá uma folga
              de até 50 m conforme a precisão do aparelho.
            </li>
            <li>
              Alguém reclamou que está na fábrica e aparece fora? Aumente o
              raio ou refaça o ponto de dentro da fábrica.
            </li>
          </ul>
        </aside>
      </div>
    </>
  );
}
