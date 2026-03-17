import { NextRequest, NextResponse } from 'next/server';
import * as ort from 'onnxruntime-node';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { env } from '@/lib/env';

// 🚀 타입 정의
interface OCRBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface OCRResult {
  text: string;
  score: number;
  box: OCRBox | number[][] | number[];
}

// PaddleOCR 라이브러리 내부 구조 정의
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

// 서비스 인스턴스 인터페이스 확장
interface PaddleOcrServiceInstance {
  recognize: (options: { width: number; height: number; data: Uint8Array }) => Promise<unknown[]>;
  detectionSession?: ort.InferenceSession;
  recognitionSession?: ort.InferenceSession;
  detectionService?: unknown;
  recognitionService?: unknown;
  options: {
    detection: unknown;
    recognition: unknown;
  };
}

// 전역 객체 타입 정의 (any 제거)
interface GlobalWithPaddle {
  paddleocr: PaddleOcrLib;
  self: GlobalWithPaddle;
}

const g = global as unknown as GlobalWithPaddle;

// 전역 싱글톤 인스턴스
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
 * LLM을 호출하여 OCR 텍스트를 와인 정보로 정제
 */
async function callLLMToRefine(ocrText: string) {
  try {
    const response = await fetch(env.LLM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: env.LLM_MODEL,
        messages: [
          {
            role: 'system',
            content:
              '너는 와인 라벨 OCR 텍스트에서 와이너리, 와인 이름, 생산 연도를 추출하여 JSON으로 변환하는 전문가야.',
          },
          {
            role: 'user',
            content: `다음은 와인 라벨에서 추출된 텍스트들이야. 이 정보들 중에서 와이너리(제조사), 와인 이름, 빈티지(생산 연도)를 찾아줘.\n\n[OCR Text]\n${ocrText}`,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'wine_info',
            schema: {
              type: 'object',
              properties: {
                winery: { type: 'string', description: '와이너리 또는 제조사 이름' },
                wineName: { type: 'string', description: '와인의 정식 이름' },
                vintage: { type: 'string', description: '생산 연도 (숫자 4자리)' },
              },
              required: ['winery', 'wineName', 'vintage'],
            },
          },
        },
        temperature: 0,
        max_tokens: 32768,
        top_p: 0.8,
        presence_penalty: 1.5,
        chat_template_kwargs: { enable_thinking: false },
      }),
    });

    if (!response.ok) throw new Error('LLM 서버 응답 실패');

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    const result = typeof content === 'string' ? JSON.parse(content) : content;

    // 로직 추가: vintage가 숫자가 아니면 빈 값으로 설정하여 프론트에서 가이드 텍스트 노출 유도
    if (result && typeof result.vintage === 'string') {
      const cleanVintage = result.vintage.trim();
      if (!/^\d+$/.test(cleanVintage)) {
        result.vintage = '';
      }
    }

    return result;
  } catch (error) {
    console.error('❌ LLM Refine Error:', error);
    return { winery: '', wineName: '', vintage: '' }; // 실패 시 빈 값 반환
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) return NextResponse.json({ error: '이미지 파일이 없습니다.' }, { status: 400 });

    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const ocrService = await getOcrService();

    // 1. 이미지 전처리
    const { data, info } = await sharp(buffer)
      .resize({ width: 1080, height: 1080, fit: 'inside', withoutEnlargement: true })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // 2. OCR 추론
    const rawResults = await ocrService.recognize({
      width: info.width,
      height: info.height,
      data: new Uint8Array(data),
    });

    console.log('📦 [Server OCR] Raw Item Example:', JSON.stringify(rawResults?.[0]));

    // 3. 결과 정제 및 텍스트 결합
    const simplifiedResults: OCRResult[] = Array.isArray(rawResults)
      ? rawResults.map((item: unknown) => {
          let text = '';
          let score = 0;
          let box: OCRBox | number[][] | number[] = [];

          if (item && typeof item === 'object' && !Array.isArray(item)) {
            const obj = item as {
              text?: string;
              confidence?: number;
              score?: number;
              box?: unknown;
              points?: unknown;
              point?: unknown;
              bbox?: unknown;
            };
            text = String(obj.text || '');
            score = Number(obj.confidence || obj.score || 0);
            box = (obj.box || obj.points || obj.point || obj.bbox || []) as
              | OCRBox
              | number[][]
              | number[];
          } else if (Array.isArray(item) && item.length >= 2) {
            box = (Array.isArray(item[0]) ? item[0] : []) as number[][] | number[];
            const val = item[1];
            text = String(Array.isArray(val) ? val[0] : val);
            score = Number(Array.isArray(val) ? val[1] : 0);
          }
          return { text, score, box };
        })
      : [];

    // 4. LLM 정제 요청 (인식된 텍스트 중 스코어가 0.8(80점) 초과인 것만 결합하여 전송)
    const allText = simplifiedResults.map((r) => r.text).join('\n');
    const filteredText = simplifiedResults
      .filter((r) => r.score > 0.8)
      .map((r) => r.text)
      .join('\n');

    console.log('📡 [Server OCR] LLM 정제 요청 중 (신뢰도 80점 초과만 포함)...');
    const refinedData = await callLLMToRefine(filteredText || allText);
    console.log('✅ [Server OCR] LLM 정제 완료:', refinedData);

    return NextResponse.json({
      success: true,
      results: simplifiedResults,
      refined: refinedData, // LLM이 정제한 구조화된 데이터
      imageInfo: { width: info.width, height: info.height },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '서버 내부 오류';
    console.error('❌ Server OCR Critical Error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
