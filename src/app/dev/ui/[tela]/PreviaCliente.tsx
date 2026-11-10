"use client";

import { CameraCapture } from "@/components/CameraCapture";
import { Comprovante } from "@/components/PontoCliente";

/** Telas de tela cheia (câmera e comprovante) para a pré-visualização. */
export function PreviaCliente({ tela, agora }: { tela: string; agora: string }) {
  if (tela === "comprovante") {
    return (
      <Comprovante
        resultado={{ tipo: "fim_intervalo", marcado_em: agora, cerca: "Fábrica" }}
        onFechar={() => {}}
      />
    );
  }
  return (
    <CameraCapture
      titulo="Registrar entrada"
      instrucao="Siga as instruções na tela."
      acaoLabel="Confirmar"
      provaDeVida
      onDescritor={() => {}}
      onCancelar={() => {}}
    />
  );
}
