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
