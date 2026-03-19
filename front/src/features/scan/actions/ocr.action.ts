'use server';

import * as ort from 'onnxruntime-node';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { env } from '@/lib/env';
import { OCRResult } from '../types';

interface PaddleOcrServiceInstance {
  recognize: (options: { width: number; height: number; data: Uint8Array }) => Promise<unknown[]>;
  detectionSession?: ort.InferenceSession;
  recognitionSession?: ort.InferenceSession;
  detectionService?: unknown;
  recognitionService?: unknown;
  initialize?: () => Promise<void>;
  options: {
    detection: unknown;
    recognition: unknown;
  };
}

let ocrServiceInstance: PaddleOcrServiceInstance | null = null;

async function getOcrService(): Promise<PaddleOcrServiceInstance> {
  if (ocrServiceInstance) return ocrServiceInstance;

  // 1. 패키지 동적 임포트
  const paddleocrModule = await import('paddleocr');
  const PaddleOcrService =
    paddleocrModule.PaddleOcrService ||
    (paddleocrModule.default ? paddleocrModule.default.PaddleOcrService : null);
  const DetectionService =
    paddleocrModule.DetectionService ||
    (paddleocrModule.default ? paddleocrModule.default.DetectionService : null);
  const RecognitionService =
    paddleocrModule.RecognitionService ||
    (paddleocrModule.default ? paddleocrModule.default.RecognitionService : null);

  if (!PaddleOcrService) {
    throw new Error('PaddleOcrService를 로드할 수 없습니다.');
  }

  // 2. 모델 파일 로드
  const modelDir = path.join(process.cwd(), 'public', 'models', 'server');
  const dictDir = path.join(process.cwd(), 'public', 'models', 'dicts');

  const [detBuffer, recBuffer, dictText] = await Promise.all([
    fs.readFile(path.join(modelDir, 'det_server.onnx')),
    fs.readFile(path.join(modelDir, 'rec_latin.onnx')),
    fs.readFile(path.join(dictDir, 'latin_dict.txt'), 'utf-8'),
  ]);

  const dictArray = dictText.replace(/\r/g, '').split('\n');
  dictArray.unshift('blank');

  // 3. 서비스 인스턴스 생성
  const instance = (await PaddleOcrService.createInstance({
    ort: ort,
    detection: { modelBuffer: detBuffer, limitSideLen: 960 },
    recognition: { modelBuffer: recBuffer, charactersDictionary: dictArray },
  })) as PaddleOcrServiceInstance;

  // 4. 세션 초기화 로직 보강 (필요한 경우)
  if (DetectionService && RecognitionService) {
    const cpuOptions: ort.InferenceSession.SessionOptions = {
      executionProviders: ['cpu'],
      graphOptimizationLevel: 'basic',
    };

    instance.initialize = async function (this: PaddleOcrServiceInstance) {
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
  }

  ocrServiceInstance = instance;
  return ocrServiceInstance;
}

/**
 * Spring 서버를 호출하여 OCR 텍스트를 와인 정보로 정제
 */
async function callSpringToRefine(ocrText: string, isMenu: boolean = false) {
  try {
    const endpoint = isMenu ? '/ai/menu' : '/ai/label';

    // Server Action 내에서 백엔드로 통신할 때 내부 도커 주소 사용 시도
    // 만약 env.API_BASE_URL이 상대 경로(/api)라면 컨테이너 이름을 포함한 절대 주소로 변환
    let baseUrl = env.API_BASE_URL;
    if (baseUrl.startsWith('/')) {
      baseUrl = `http://backend-spring:8080${baseUrl}`;
    }

    const formData = new FormData();
    const requestBlob = new Blob([JSON.stringify({ textContent: ocrText })], {
      type: 'application/json',
    });
    formData.append('request', requestBlob);

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error(`Spring 정제 요청 실패 (상태: ${response.status})`);

    const result = await response.json();
    if (!result.data || !result.data.data) {
      return isMenu
        ? { wine_names: [], food_names: [] }
        : { winery: '', wine_name: '', vintage: '' };
    }
    return result.data.data;
  } catch (error) {
    console.error('❌ callSpringToRefine Error:', error);
    return isMenu ? { wine_names: [], food_names: [] } : { winery: '', wine_name: '', vintage: '' };
  }
}

/**
 * [Server Action] 이미지 분석 실행
 */
export async function executeOcrAction(formData: FormData) {
  try {
    const imageFile = formData.get('image') as File;
    if (!imageFile) throw new Error('이미지 파일이 없습니다.');

    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const ocrService = await getOcrService();

    // 1. 이미지 전처리 및 OCR
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

    // 2. 결과 가공
    const simplifiedResults: OCRResult[] = Array.isArray(rawResults)
      ? rawResults.map((item: unknown) => {
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

    // 3. 백엔드 정제 요청
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
    console.error('❌ executeOcrAction Error:', error);
    return { success: false, error: '서버 분석 중 오류 발생', results: [] };
  }
}
