// Utilidades de geolocalização (cerca eletrônica).

export interface Ponto {
  lat: number;
  lng: number;
}

/** Distância em metros entre dois pontos (fórmula de Haversine). */
export function distanciaMetros(a: Ponto, b: Ponto): number {
  const R = 6371000; // raio da Terra em metros
  const toRad = (g: number) => (g * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export interface Cerca {
  latitude: number;
  longitude: number;
  raio_metros: number;
}

export interface ResultadoCerca {
  dentro: boolean;
  distancia: number; // metros até o centro da cerca
}

/**
 * Tolerância máxima concedida pela imprecisão do GPS. Dentro de galpões o
 * sinal piora (±20–50 m é comum); concedemos até este valor de margem, mas não
 * mais, para que uma leitura muito imprecisa não "libere" quem está longe.
 */
export const TOLERANCIA_GPS_MAX_M = 50;

/**
 * Avalia se a posição está dentro da cerca, considerando a precisão informada
 * pelo GPS: a pessoa é aceita se o círculo de incerteza tocar a cerca.
 */
export function avaliarCerca(
  pos: Ponto,
  cerca: Cerca,
  precisao?: number | null,
): ResultadoCerca {
  const distancia = distanciaMetros(pos, {
    lat: cerca.latitude,
    lng: cerca.longitude,
  });
  const margem =
    typeof precisao === "number" && isFinite(precisao) && precisao > 0
      ? Math.min(precisao, TOLERANCIA_GPS_MAX_M)
      : 0;
  return { dentro: distancia - margem <= cerca.raio_metros, distancia };
}

/** Avalia todas as cercas e devolve a mais próxima (ou a primeira em que está dentro). */
export function melhorCerca<C extends Cerca>(
  pos: Ponto,
  cercas: C[],
  precisao?: number | null,
): { cerca: C; dentro: boolean; distancia: number } | null {
  let melhor: { cerca: C; dentro: boolean; distancia: number } | null = null;
  for (const c of cercas) {
    const r = avaliarCerca(pos, c, precisao);
    if (
      !melhor ||
      (r.dentro && !melhor.dentro) ||
      (r.dentro === melhor.dentro && r.distancia < melhor.distancia)
    ) {
      melhor = { cerca: c, ...r };
    }
  }
  return melhor;
}
