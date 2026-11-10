"use client";

// Carrega o face-api no navegador e extrai o descritor facial de um vídeo.
// Import dinâmico para não pesar no bundle inicial nem quebrar no SSR.

type FaceApi = typeof import("@vladmandic/face-api");

let faceapiPromise: Promise<FaceApi> | null = null;
let modelosCarregados = false;

async function getFaceApi(): Promise<FaceApi> {
  if (!faceapiPromise) {
    faceapiPromise = import("@vladmandic/face-api");
  }
  return faceapiPromise;
}

/** Carrega os modelos de /public/models uma única vez. */
export async function carregarModelos(): Promise<void> {
  if (modelosCarregados) return;
  const faceapi = await getFaceApi();
  const url = "/models";
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(url),
    faceapi.nets.faceLandmark68Net.loadFromUri(url),
    faceapi.nets.faceRecognitionNet.loadFromUri(url),
  ]);
  modelosCarregados = true;
}

/**
 * Detecta um único rosto no vídeo e retorna o descritor (128 números).
 * Retorna null se nenhum rosto for detectado.
 */
export async function extrairDescritor(
  video: HTMLVideoElement,
): Promise<number[] | null> {
  const faceapi = await getFaceApi();
  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 320,
    scoreThreshold: 0.5,
  });
  const deteccao = await faceapi
    .detectSingleFace(video, options)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!deteccao) return null;
  return Array.from(deteccao.descriptor);
}

/**
 * Leitura rápida do rosto (sem descritor) para a prova de vida: mede o quanto
 * o nariz está deslocado em relação aos olhos. Retorna null se não há rosto.
 */
export async function lerRosto(
  video: HTMLVideoElement,
): Promise<import("./liveness").LeituraRosto | null> {
  const faceapi = await getFaceApi();
  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 224,
    scoreThreshold: 0.5,
  });
  const det = await faceapi.detectSingleFace(video, options).withFaceLandmarks();
  if (!det) return null;

  // Modelo de 68 pontos: 36 e 45 = cantos externos dos olhos; 30 = ponta do nariz.
  const p = det.landmarks.positions;
  const olhoA = p[36];
  const olhoB = p[45];
  const nariz = p[30];
  const entreOlhos = olhoB.x - olhoA.x;
  if (!(entreOlhos > 1)) return null;

  const box = det.detection.box;
  return {
    desvio: (nariz.x - olhoA.x) / entreOlhos - 0.5,
    cx: box.x + box.width / 2,
    cy: box.y + box.height / 2,
    largura: box.width,
  };
}
