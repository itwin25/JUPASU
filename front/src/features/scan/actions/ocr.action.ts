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
  box: any[];
}

let ocrServiceInstance: any = null;

async function getOcrService() {
  if (ocrServiceInstance) return ocrServiceInstance;

  const paddleocrModule = (await import('paddleocr')) as any;
  const { PaddleOcrService, DetectionService, RecognitionService } = paddleocrModule;

  const modelDir = path.join(process.cwd(), 'public', 'models', 'server');
  const dictDir = path.join(process.cwd(), 'public', 'models', 'dicts');

  // 메뉴판 스캔을 위해 한국어 모델(rec_ko.onnx)과 사전(ko_dict.txt) 사용
  const [detBuffer, recBuffer, dictText] = await Promise.all([
    fs.readFile(path.join(modelDir, 'det_server.onnx')),
    fs.readFile(path.join(modelDir, 'rec_ko.onnx')),
    fs.readFile(path.join(dictDir, 'ko_dict.txt'), 'utf-8'),
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
    this.detectionService = new DetectionService(ort, this.detectionSession, this.options.detection);
    this.recognitionService = new RecognitionService(ort, this.recognitionSession, this.options.recognition);
  };

  ocrServiceInstance = instance;
  return ocrServiceInstance;
}

/**
 * [완전 격리] 어떤 외부 라이브러리도 쓰지 않는 순수 Fetch 통신
 */
async function callBackendRefine(task: string, text: string | string[]) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('jupasu_access_token')?.value;
    
    // 로컬 환경 및 도커 환경 모두 대응 (환경 변수 권장)
    const internalUrl = process.env.NODE_ENV === 'production' 
      ? 'http://backend:8080/api/ai/refine'
      : 'http://localhost:8080/api/ai/refine';

    console.log(`📡 [Server Action] Pure Fetch Start: ${task} (Parallel Support)`);

    const response = await fetch(internalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ task, textContent: text }),
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('❌ Backend Response Not OK');
      return null;
    }

    const json = await response.json();
    return json; // data 필드 포함 전체 반환
  } catch (err) {
    console.error('❌ callBackendRefine Error:', err);
    return null;
  }
}

/**
 * 단일 이미지 OCR 수행 내부 함수
 */
async function processSingleImage(buffer: Buffer) {
  try {
    const ocrService = await getOcrService();

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

    const simplifiedResults: OCRResult[] = (rawResults || []).map((item: any) => ({
      text: item?.text || '',
      score: item?.confidence || item?.score || 0,
      box: [],
    }));

    const text = simplifiedResults.filter(r => r.score > 0.6).map(r => r.text).join(' ');
    
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
    const taskType = (formData.get('task') as string) || 'LABEL_SCAN';
    
    if (!images || images.length === 0) throw new Error('No images provided');

    console.log(`📸 [OCR Action] Parallel Processing ${images.length} images for task: ${taskType}`);

    // [Scatter] 모든 이미지를 병렬로 처리 시작
    const processTasks = images.map(async (imageFile) => {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      return processSingleImage(buffer);
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
    console.log(`📤 [Server Action] Sending to Backend (Task: ${taskType}, Images: ${textList.length})`);
    if (taskType === 'MENU_SCAN') {
      console.log('📝 Extracted Text List Header:', textList.map(t => t.substring(0, 50) + '...'));
    }

    const apiResponse = await callBackendRefine(
      taskType,
      textList.join('\n') || 'unknown'
    );

    console.log('📥 [Server Action] Received from Backend:', JSON.stringify(apiResponse, null, 2));

    // ApiResponse.data -> RefineResponse
    const refineResponse = apiResponse?.data || null;
    
    // RefineResponse.data -> { wineNames, foodNames }
    const refinedData = refineResponse?.data || null;

    return {
      success: true,
      results: allResults,
      refined: refinedData,
      provider: refineResponse?.provider || 'unknown',
      imageInfo: lastInfo,
    };

  } catch (error: any) {
    console.error('❌ executeOcrAction Fatal Error:', error.message);
    return { success: false, error: error.message };
  }
}
