'use server';

import * as ort from 'onnxruntime-node';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { env } from '@/lib/env';
import { OCRResult } from '../types';

// --- [기존 OCR 로직 복구] ---
interface PaddleOcrLib {
  PaddleOcrService: {
    createInstance: (options: unknown) => Promise<PaddleOcrServiceInstance>;
    prototype: {
      initialize: (this: PaddleOcrServiceInstance) => Promise<void>;
    };
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
}

interface PaddleOcrServiceInstance {
  recognize: (options: { width: number; height: number; data: Uint8Array }) => Promise<unknown[]>;
  detectionSession?: ort.InferenceSession;
  recognitionSession?: ort.InferenceSession;
  detectionService?: unknown;
  recognitionService?: unknown;
  options: { detection: unknown; recognition: unknown };
}

interface GlobalWithPaddle {
  paddleocr: PaddleOcrLib;
  self: GlobalWithPaddle;
}

const g = global as unknown as GlobalWithPaddle;
let ocrServiceInstance: PaddleOcrServiceInstance | null = null;

async function getOcrService(): Promise<PaddleOcrServiceInstance> {
  if (ocrServiceInstance) return ocrServiceInstance;
  g.self = g;
  await import('paddleocr/dist/index.js');
  const { PaddleOcrService } = g.paddleocr;
  const modelDir = path.join(process.cwd(), 'public', 'models', 'server');
  const dictDir = path.join(process.cwd(), 'public', 'models', 'dicts');
  const [detBuffer, recBuffer, dictText] = await Promise.all([
    fs.readFile(path.join(modelDir, 'det_server.onnx')),
    fs.readFile(path.join(modelDir, 'rec_latin.onnx')),
    fs.readFile(path.join(dictDir, 'latin_dict.txt'), 'utf-8'),
  ]);
  const cpuOptions: ort.InferenceSession.SessionOptions = {
    executionProviders: ['cpu'],
    graphOptimizationLevel: 'basic',
  };
  PaddleOcrService.prototype.initialize = async function (this: PaddleOcrServiceInstance) {
    const lib = g.paddleocr;
    this.detectionSession = await ort.InferenceSession.create(detBuffer, cpuOptions);
    this.recognitionSession = await ort.InferenceSession.create(recBuffer, cpuOptions);
    this.detectionService = new lib.DetectionService(
      ort,
      this.detectionSession,
      this.options.detection,
    );
    this.recognitionService = new lib.RecognitionService(
      ort,
      this.recognitionSession,
      this.options.recognition,
    );
  };
  const dictArray = dictText.replace(/\r/g, '').split('\n');
  dictArray.unshift('blank');
  ocrServiceInstance = (await PaddleOcrService.createInstance({
    ort: ort,
    detection: { modelBuffer: detBuffer, limitSideLen: 960 },
    recognition: { modelBuffer: recBuffer, charactersDictionary: dictArray },
  })) as PaddleOcrServiceInstance;
  return ocrServiceInstance;
}

/**
 * [수정됨] Spring 서버를 호출하여 OCR 텍스트를 와인 정보로 정제
 */
async function callSpringToRefine(ocrText: string, isMenu: boolean = false) {
  try {
    const endpoint = isMenu ? '/ai/menu' : '/ai/label';

    // Spring의 SommelierRequest DTO 규격에 맞춰 전송
    const formData = new FormData();
    const requestBlob = new Blob([JSON.stringify({ textContent: ocrText })], {
      type: 'application/json',
    });
    formData.append('request', requestBlob);

    const response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Spring 정제 요청 실패');

    const result = await response.json();
    return result.data.data; // FastAPI가 반환하는 정제된 데이터 (winery, wine_name, vintage 등)
  } catch (error) {
    console.error('❌ Spring Refine Error:', error);
    return isMenu ? { wine_names: [], food_names: [] } : { winery: '', wine_name: '', vintage: '' };
  }
}

/**
 * [Server Action] 이미지 분석 실행
 * 1. 프론트엔드 서버에서 OCR 수행 (기존 로직)
 * 2. 추출된 텍스트만 백엔드로 보내서 정제 (신규 로직)
 */
export async function executeOcrAction(formData: FormData) {
  try {
    const imageFile = formData.get('image') as File;
    if (!imageFile) throw new Error('이미지 파일이 없습니다.');

    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const ocrService = await getOcrService();

    // 1. 이미지 전처리 및 OCR (프론트 서버)
    const { data, info } = await sharp(buffer)
      .resize({ width: 1080, height: 1080, fit: 'inside', withoutEnlargement: true })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const rawResults = await ocrService.recognize({
      width: info.width,
      height: info.height,
      data: new Uint8Array(data),
    });

    // 2. 결과 텍스트 추출
    const simplifiedResults: OCRResult[] = Array.isArray(rawResults)
      ? rawResults.map((item: unknown) => {
          // PaddleOCR의 다양한 응답 형식을 안전하게 처리
          let text = '';
          let score = 0;

          if (item && typeof item === 'object') {
            const resultItem = item as { text?: string; confidence?: number; score?: number };
            text = resultItem.text || '';
            score = resultItem.confidence || resultItem.score || 0;
          } else if (Array.isArray(item) && item.length >= 2) {
            text = String(Array.isArray(item[1]) ? item[1][0] : item[1]);
            score = Number(Array.isArray(item[1]) ? item[1][1] : 0);
          }

          return { text, score, box: [] };
        })
      : [];

    const allText = simplifiedResults.map((r) => r.text).join('\n');
    const filteredText = simplifiedResults
      .filter((r) => r.score > 0.8)
      .map((r) => r.text)
      .join('\n');

    // 3. 백엔드(Spring -> FastAPI)에 정제 요청
    const refinedData = await callSpringToRefine(filteredText || allText, false);

    return {
      success: true,
      results: simplifiedResults,
      refined: {
        winery: refinedData.winery || '',
        wineName: refinedData.wine_name || '',
        vintage: refinedData.vintage || '',
      },
      imageInfo: { width: info.width, height: info.height },
    };
  } catch (error) {
    console.error('❌ Server Action OCR Error:', error);
    return { success: false, error: '서버 분석 중 오류 발생', results: [] };
  }
}
