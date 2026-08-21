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
  distancia: number; // metros
}

export function avaliarCerca(pos: Ponto, cerca: Cerca): ResultadoCerca {
  const distancia = distanciaMetros(pos, {
    lat: cerca.latitude,
    lng: cerca.longitude,
  });
  return { dentro: distancia <= cerca.raio_metros, distancia };
}
