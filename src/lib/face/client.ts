"use client";

// Carrega o face-api no navegador e extrai o descritor facial de um vídeo.
// Import dinâmico para não pesar no bundle inicial nem quebrar no SSR.

type FaceApi = typeof import("@vladmandic/face-api");

let faceapiPromise: Promise<FaceApi> | null = null;
let prontoPromise: Promise<void> | null = null;

async function getFaceApi(): Promise<FaceApi> {
  if (!faceapiPromise) {
    faceapiPromise = import("@vladmandic/face-api");
  }
  return faceapiPromise;
}

/*
 * Ajuste do detector. Medido em fotos de teste:
 *  - 224 px / confiança 0,5 (o ajuste antigo) não achava rosto em 3 de 6 fotos;
 *  - 320 px / 0,35 achou em todas, ainda rápido o bastante para o laço.
 * Na captura final usamos 416 px, mais preciso para o descritor.
 */
const LEITURA = { inputSize: 320, scoreThreshold: 0.35 };
const LEITURA_REFORCO = { inputSize: 416, scoreThreshold: 0.3 };
const CAPTURA = { inputSize: 416, scoreThreshold: 0.35 };

/**
 * Carrega os modelos de /public/models uma única vez e "aquece" o
 * processamento: a primeira detecção no celular levava ~8 s (compilação
 * na placa de vídeo), o que parecia que a câmera não estava lendo.
 */
export function carregarModelos(): Promise<void> {
  if (!prontoPromise) {
    prontoPromise = (async () => {
      const faceapi = await getFaceApi();
      const url = "/models";
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(url),
        faceapi.nets.faceLandmark68Net.loadFromUri(url),
        faceapi.nets.faceRecognitionNet.loadFromUri(url),
      ]);
      try {
        const tela = document.createElement("canvas");
        tela.width = 320;
        tela.height = 320;
        const ctx = tela.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#808080";
          ctx.fillRect(0, 0, 320, 320);
        }
        await faceapi
          .detectSingleFace(tela, new faceapi.TinyFaceDetectorOptions(LEITURA))
          .withFaceLandmarks();
      } catch {
        // aquecimento é só otimização
      }
    })().catch((e) => {
      prontoPromise = null; // deixa tentar de novo numa próxima abertura
      throw e;
    });
  }
  return prontoPromise;
}

/** O vídeo já tem imagem para analisar? */
function videoPronto(video: HTMLVideoElement): boolean {
  return video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0;
}

/*
 * Velocidade: a câmera entrega até 1280 px; mandar isso para a rede neural a
 * cada quadro deixava o iPhone lento. Reduzimos cada quadro para no máximo
 * 480 px num canvas reaproveitado — o detector trabalha em 320 px de todo jeito.
 */
const LADO_MAX = 480;
let tela: HTMLCanvasElement | null = null;

function quadroReduzido(video: HTMLVideoElement): HTMLCanvasElement {
  const escala = Math.min(1, LADO_MAX / Math.max(video.videoWidth, video.videoHeight));
  const w = Math.round(video.videoWidth * escala);
  const h = Math.round(video.videoHeight * escala);
  if (!tela) tela = document.createElement("canvas");
  if (tela.width !== w) tela.width = w;
  if (tela.height !== h) tela.height = h;
  tela.getContext("2d", { alpha: false })?.drawImage(video, 0, 0, w, h);
  return tela;
}

// Leituras seguidas sem rosto: a tentativa reforçada (mais pesada) só roda
// de tempos em tempos, não em todo quadro.
let falhasSeguidas = 0;

/**
 * Detecta um único rosto no vídeo e retorna o descritor (128 números).
 * Retorna null se nenhum rosto for detectado.
 */
export async function extrairDescritor(
  video: HTMLVideoElement,
): Promise<number[] | null> {
  if (!videoPronto(video)) return null;
  const faceapi = await getFaceApi();
  // Captura final: primeiro no tamanho rápido; o maior só se não achar.
  const quadro = quadroReduzido(video);
  let deteccao = await faceapi
    .detectSingleFace(quadro, new faceapi.TinyFaceDetectorOptions(LEITURA))
    .withFaceLandmarks()
    .withFaceDescriptor();
  if (!deteccao) {
    deteccao = await faceapi
      .detectSingleFace(quadro, new faceapi.TinyFaceDetectorOptions(CAPTURA))
      .withFaceLandmarks()
      .withFaceDescriptor();
  }
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
  if (!videoPronto(video)) return null;
  const faceapi = await getFaceApi();
  const quadro = quadroReduzido(video);
  // A cada 3 falhas seguidas, tenta com mais detalhe (rosto pequeno ou
  // pouca luz); nas demais, uma só detecção rápida por quadro.
  const reforco = falhasSeguidas > 0 && falhasSeguidas % 3 === 0;
  const det = await faceapi
    .detectSingleFace(
      quadro,
      new faceapi.TinyFaceDetectorOptions(reforco ? LEITURA_REFORCO : LEITURA),
    )
    .withFaceLandmarks();
  if (!det) {
    falhasSeguidas++;
    return null;
  }
  falhasSeguidas = 0;

  // Modelo de 68 pontos: 36–41 olho esquerdo, 42–47 olho direito, 30 = ponta
  // do nariz. Usar o centro de cada olho (e não só o canto) dá menos ruído.
  const p = det.landmarks.positions;
  const media = (a: number, b: number) => {
    let s = 0;
    for (let i = a; i <= b; i++) s += p[i].x;
    return s / (b - a + 1);
  };
  const olhoA = media(36, 41);
  const olhoB = media(42, 47);
  const entreOlhos = olhoB - olhoA;
  if (!(entreOlhos > 1)) return null;

  const box = det.detection.box;
  return {
    desvio: (p[30].x - olhoA) / entreOlhos - 0.5,
    cx: box.x + box.width / 2,
    cy: box.y + box.height / 2,
    largura: box.width,
  };
}
