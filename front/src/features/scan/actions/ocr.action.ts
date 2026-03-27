'use server';

import * as ort from 'onnxruntime-node';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { cookies } from 'next/headers';

// 타입을 직접 정의하여 외부 의존성 제거
export interface OCRResult {
  text: string;
  score: number;
  box: number[][];
}

type OcrTaskType = 'LABEL_SCAN' | 'MENU_SCAN';
type OcrRecognizerKind = 'ko' | 'latin';
type RawOcrItem = {
  text?: string;
  confidence?: number;
  score?: number;
};
type PreparedImage = {
  variant: string;
  data: Uint8Array;
  info: { width: number; height: number };
};

type OcrServiceInstance = {
  options: {
    detection: unknown;
    recognition: unknown;
  };
  recognize(input: { width: number; height: number; data: Uint8Array }): Promise<RawOcrItem[]>;
  initialize?: () => Promise<void>;
  detectionSession?: ort.InferenceSession;
  recognitionSession?: ort.InferenceSession;
  detectionService?: unknown;
  recognitionService?: unknown;
};

type PaddleOcrModule = {
  PaddleOcrService: {
    createInstance(config: {
      ort: typeof ort;
      detection: { modelBuffer: Buffer; limitSideLen: number };
      recognition: { modelBuffer: Buffer; charactersDictionary: string[] };
    }): Promise<OcrServiceInstance>;
  };
  DetectionService: new (
    ortModule: typeof ort,
    session: ort.InferenceSession,
    options: unknown,
  ) => unknown;
  RecognitionService: new (
    ortModule: typeof ort,
    session: ort.InferenceSession,
    options: unknown,
  ) => unknown;
};

type BackendRefineResponse =
  | {
      _error: string;
    }
  | {
      data?: {
        data?: {
          wineNames?: string[];
          foodNames?: string[];
        };
        provider?: string;
      };
    }
  | null;

const ocrServiceInstances: Partial<Record<OcrRecognizerKind, OcrServiceInstance>> = {};

function isBackendRefineError(response: BackendRefineResponse): response is { _error: string } {
  return Boolean(response && '_error' in response);
}

function isBackendRefineSuccess(response: BackendRefineResponse): response is {
  data?: {
    data?: {
      wineNames?: string[];
      foodNames?: string[];
    };
    provider?: string;
  };
} {
  return Boolean(response && !('_error' in response));
}

async function getOcrService(kind: OcrRecognizerKind) {
  if (ocrServiceInstances[kind]) return ocrServiceInstances[kind];

  const paddleocrModule = (await import('paddleocr')) as unknown as PaddleOcrModule;
  const { PaddleOcrService, DetectionService, RecognitionService } = paddleocrModule;

  const modelDir = path.join(process.cwd(), 'public', 'models', 'server');
  const dictDir = path.join(process.cwd(), 'public', 'models', 'dicts');

  const recModelFile = kind === 'latin' ? 'rec_latin.onnx' : 'rec_ko.onnx';
  const dictFile = kind === 'latin' ? 'latin_dict.txt' : 'ko_dict.txt';

  // 메뉴판 스캔을 위해 한국어/라틴 모델을 분리 사용
  const [detBuffer, recBuffer, dictText] = await Promise.all([
    fs.readFile(path.join(modelDir, 'det_server.onnx')),
    fs.readFile(path.join(modelDir, recModelFile)),
    fs.readFile(path.join(dictDir, dictFile), 'utf-8'),
  ]);

  const dictArray = dictText.replace(/\r/g, '').split('\n');
  dictArray.unshift('blank');

  const instance = await PaddleOcrService.createInstance({
    ort: ort,
    detection: { modelBuffer: detBuffer, limitSideLen: 960 },
    recognition: { modelBuffer: recBuffer, charactersDictionary: dictArray },
  });

  const cpuOptions: ort.InferenceSession.SessionOptions = {
    executionProviders: ['cpu'],
    graphOptimizationLevel: 'basic',
  };

  instance.initialize = async function () {
    this.detectionSession = await ort.InferenceSession.create(detBuffer, cpuOptions);
    this.recognitionSession = await ort.InferenceSession.create(recBuffer, cpuOptions);
    this.detectionService = new DetectionService(
      ort,
      this.detectionSession,
      this.options.detection,
    );
    this.recognitionService = new RecognitionService(
      ort,
      this.recognitionSession,
      this.options.recognition,
    );
  };

  ocrServiceInstances[kind] = instance;
  return ocrServiceInstances[kind];
}

function normalizeResultText(text: string) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function getMinScoreByRecognizer(kind: OcrRecognizerKind, taskType: OcrTaskType) {
  if (taskType === 'MENU_SCAN') {
    return kind === 'latin' ? 0.5 : 0.55;
  }
  return kind === 'latin' ? 0.55 : 0.6;
}

function mergeOcrResults(
  taskType: OcrTaskType,
  batches: Array<{ kind: OcrRecognizerKind; results: OCRResult[] }>,
) {
  const merged = new Map<string, OCRResult>();

  for (const batch of batches) {
    const minScore = getMinScoreByRecognizer(batch.kind, taskType);

    for (const item of batch.results) {
      const normalizedText = normalizeResultText(item.text);
      if (!normalizedText || item.score < minScore) continue;

      const existing = merged.get(normalizedText);
      if (!existing || item.score > existing.score) {
        merged.set(normalizedText, {
          ...item,
          text: normalizedText,
        });
      }
    }
  }

  return Array.from(merged.values()).sort(
    (left, right) => right.score - left.score || right.text.length - left.text.length,
  );
}

async function buildPreparedImage(
  image: sharp.Sharp,
  variant: string,
  width: number,
): Promise<PreparedImage> {
  const { data, info } = await image
    .resize({ width, height: width, fit: 'inside', withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return {
    variant,
    data: new Uint8Array(data),
    info: { width: info.width, height: info.height },
  };
}

async function prepareImages(buffer: Buffer, taskType: OcrTaskType) {
  const baseWidth = taskType === 'MENU_SCAN' ? 1440 : 1080;
  const original = sharp(buffer, { failOn: 'none' }).rotate();
  const enhanced = sharp(buffer, { failOn: 'none' })
    .rotate()
    .grayscale()
    .normalize()
    .sharpen({ sigma: 1.2, m1: 0.8, m2: 2.0 });

  return Promise.all([
    buildPreparedImage(original, 'original', baseWidth),
    buildPreparedImage(enhanced, 'enhanced', baseWidth),
  ]);
}

async function recognizePreparedImage(
  preparedImage: PreparedImage,
  kind: OcrRecognizerKind,
): Promise<OCRResult[]> {
  const ocrService = await getOcrService(kind);
  const rawResults = await ocrService.recognize({
    width: preparedImage.info.width,
    height: preparedImage.info.height,
    data: preparedImage.data,
  });

  return (rawResults || []).map((item: RawOcrItem) => ({
    text: item?.text || '',
    score: item?.confidence || item?.score || 0,
    box: [],
  }));
}

/**
 * [완전 격리] 어떤 외부 라이브러리도 쓰지 않는 순수 Fetch 통신
 */
async function callBackendRefine(task: string, text: string | string[]) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('jupasu_access_token')?.value;

    // 로컬 환경 및 도커 환경 모두 대응 (환경 변수 권장)
    const internalUrl =
      process.env.NODE_ENV === 'production'
        ? 'http://backend:8080/api/ai/refine'
        : 'http://localhost:8080/api/ai/refine';

    console.log(`📡 [Server Action] Pure Fetch Start: ${task} (Parallel Support)`);

    const response = await fetch(internalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ task, textContent: text }),
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(
        `❌ Backend Response Not OK: ${response.status} ${response.statusText} (url: ${internalUrl})`,
      );
      return { _error: `백엔드 오류 ${response.status}` };
    }

    const json = (await response.json()) as BackendRefineResponse;
    return json; // data 필드 포함 전체 반환
  } catch (err) {
    console.error('❌ callBackendRefine Error:', err);
    return null;
  }
}

/**
 * 단일 이미지 OCR 수행 내부 함수
 */
async function processSingleImage(buffer: Buffer, taskType: OcrTaskType) {
  try {
    const preparedImages = await prepareImages(buffer, taskType);
    const recognizerKinds: OcrRecognizerKind[] =
      taskType === 'MENU_SCAN' ? ['ko', 'latin'] : ['ko'];

    const recognitionTasks = preparedImages.flatMap((preparedImage) =>
      recognizerKinds.map(async (kind) => ({
        kind,
        results: await recognizePreparedImage(preparedImage, kind),
        info: preparedImage.info,
      })),
    );

    const recognizedBatches = await Promise.all(recognitionTasks);
    const simplifiedResults = mergeOcrResults(
      taskType,
      recognizedBatches.map(({ kind, results }) => ({ kind, results })),
    );

    const text = simplifiedResults.map((result) => result.text).join('\n');
    const info = preparedImages[0]?.info || { width: 0, height: 0 };

    return { text, results: simplifiedResults, info };
  } catch (err) {
    console.error('❌ processSingleImage Error:', err);
    return { text: '', results: [], info: { width: 0, height: 0 } };
  }
}

/**
 * 다중 이미지 OCR 수행 및 결과 정제
 */
export async function executeOcrAction(formData: FormData) {
  try {
    const images = formData.getAll('image') as File[];
    const taskType = ((formData.get('task') as string) || 'LABEL_SCAN') as OcrTaskType;

    if (!images || images.length === 0) throw new Error('No images provided');

    console.log(
      `📸 [OCR Action] Parallel Processing ${images.length} images for task: ${taskType}`,
    );

    // [Scatter] 모든 이미지를 병렬로 처리 시작
    const processTasks = images.map(async (imageFile) => {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      return processSingleImage(buffer, taskType);
    });

    // [Gather] 모든 이미지 처리가 완료될 때까지 대기
    const processedResults = await Promise.all(processTasks);

    const allResults: OCRResult[] = [];
    const textList: string[] = [];
    let lastInfo = { width: 0, height: 0 };
    for (const res of processedResults) {
      if (res.text) textList.push(res.text);
      allResults.push(...res.results);
      lastInfo = res.info;
    }

    // [Step 3] 백엔드 호출 (ApiResponse<RefineResponse> 형태)
    console.log(
      `📤 [Server Action] Sending to Backend (Task: ${taskType}, Images: ${textList.length})`,
    );
    if (taskType === 'MENU_SCAN') {
      console.log(
        '📝 Extracted Text List Header:',
        textList.map((t) => t.substring(0, 50) + '...'),
      );
    }

    const apiResponse = (await callBackendRefine(
      taskType,
      textList.join('\n') || 'unknown',
    )) as BackendRefineResponse;

    console.log('📥 [Server Action] Received from Backend:', JSON.stringify(apiResponse, null, 2));

    // 에러 응답 처리
    if (isBackendRefineError(apiResponse)) {
      return {
        success: false,
        error: apiResponse._error,
        results: allResults,
        imageInfo: lastInfo,
      };
    }

    // ApiResponse.data -> RefineResponse
    const refineResponse = isBackendRefineSuccess(apiResponse) ? apiResponse.data || null : null;

    // RefineResponse.data -> { wineNames, foodNames }
    const refinedData = refineResponse?.data || null;

    if (!refinedData) {
      console.error('❌ refinedData is null. refineResponse:', JSON.stringify(refineResponse));
      return {
        success: false,
        error: 'AI 서버가 응답하지 않았습니다. AI 서버가 실행 중인지 확인해주세요.',
        results: allResults,
        imageInfo: lastInfo,
      };
    }

    return {
      success: true,
      results: allResults,
      refined: refinedData,
      provider: refineResponse?.provider || 'unknown',
      imageInfo: lastInfo,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    console.error('❌ executeOcrAction Fatal Error:', message);
    return { success: false, error: message };
  }
}
