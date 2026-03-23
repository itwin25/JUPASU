'use server';

import * as ort from 'onnxruntime-node';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { cookies } from 'next/headers';

// 타입을 직접 정의하여 외부 의존성 제거
interface OCRResult {
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

  const [detBuffer, recBuffer, dictText] = await Promise.all([
    fs.readFile(path.join(modelDir, 'det_server.onnx')),
    fs.readFile(path.join(modelDir, 'rec_latin.onnx')),
    fs.readFile(path.join(dictDir, 'latin_dict.txt'), 'utf-8'),
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
async function callBackendRefine(task: string, text: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('jupasu_access_token')?.value;
    
    // 환경 변수조차 직접 문자열로 처리하여 env.ts 의존성 제거
    const internalUrl = 'http://backend:8080/api/ai/refine';

    console.log(`📡 [Server Action] Pure Fetch Start: ${task}`);

    const response = await fetch(internalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ task, textContent: text }),
      cache: 'no-store',
    });

    console.log(`📡 [Backend Response] Status: ${response.status}`);

    if (!response.ok) {
      console.error('❌ Backend Response Not OK');
      return null;
    }

    const json = await response.json();
    console.log('✨ [AI Service Provider]:', json.data.provider || 'unknown');
    console.log('✨ [Backend JSON Data]:', JSON.stringify(json, null, 2));
    return json.data;
  } catch (err) {
    console.error('❌ callBackendRefine Error:', err);
    return null;
  }
}

export async function executeOcrAction(formData: FormData) {
  try {
    const imageFile = formData.get('image') as File;
    const taskType = (formData.get('task') as string) || 'LABEL_SCAN';
    
    if (!imageFile) throw new Error('No image');

    const buffer = Buffer.from(await imageFile.arrayBuffer());
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

    // 백엔드 호출
    const refinedData = await callBackendRefine(taskType, text || 'unknown');

    return {
      success: true,
      results: simplifiedResults,
      refined: refinedData?.data || null,
      provider: refinedData?.provider || 'unknown',
      imageInfo: { width: info.width, height: info.height },
    };

  } catch (error: any) {
    console.error('❌ executeOcrAction Fatal Error:', error.message);
    return { success: false, error: error.message };
  }
}
