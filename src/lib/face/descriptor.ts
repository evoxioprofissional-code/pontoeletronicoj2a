// Comparação de descritores faciais (128 floats). Pura matemática — roda tanto
// no cliente quanto no servidor, sem depender do face-api.

/** Distância euclidiana entre dois descritores. Menor = mais parecido. */
export function distanciaDescritor(a: number[], b: number[]): number {
  if (a.length !== b.length) return Number.POSITIVE_INFINITY;
  let soma = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    soma += d * d;
  }
  return Math.sqrt(soma);
}

/**
 * Limiar de correspondência. 0.6 é o padrão do face-api; usamos 0.55 para ser
 * um pouco mais rígido em ambiente de fábrica.
 */
export const LIMIAR_FACE = 0.55;

export interface ResultadoFace {
  reconhecido: boolean;
  distancia: number;
  score: number; // 0..1 (quanto maior, melhor)
}

export function compararFace(
  vivo: number[],
  cadastrado: number[],
  limiar = LIMIAR_FACE,
): ResultadoFace {
  const distancia = distanciaDescritor(vivo, cadastrado);
  const score = Math.max(0, Math.min(1, 1 - distancia));
  return { reconhecido: distancia <= limiar, distancia, score };
}
