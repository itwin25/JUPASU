import { NextRequest, NextResponse } from 'next/server';
import * as ort from 'onnxruntime-node';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';

// 🚀 전역 싱글톤 인스턴스를 유지하여 여러 요청이 들어와도 모델을 한 번만 로드하도록 최적화
let ocrServiceInstance: any = null;

async function getOcrService() {
  if (ocrServiceInstance) return ocrServiceInstance;

  console.log('🧪 [Server OCR] 엔진 초기화 및 모델 로딩 시작...');

  // 1. Browser 환경을 흉내내어 (Polyfill) paddleocr 패키지를 Node.js 환경에서 구동
  (global as any).self = global;
  // Next.js 환경에서 외부 CJS 모듈을 require로 불러옵니다.
  require('paddleocr/dist/index.js');
  const { PaddleOcrService } = (global as any).paddleocr;

  if (!PaddleOcrService) {
    throw new Error('PaddleOcrService를 로드할 수 없습니다.');
  }

  // 2. 서버 파일 시스템에서 모델 읽기
  const modelDir = path.join(process.cwd(), 'public', 'models', 'server');
  const dictDir = path.join(process.cwd(), 'public', 'models', 'dicts');
  const [detBuffer, recBuffer, dictText] = await Promise.all([
    fs.readFile(path.join(modelDir, 'det_server.onnx')), // 🚀 V5 서버 전용 고성능 탐지 모델
    fs.readFile(path.join(modelDir, 'rec_ko.onnx')), // 🚀 V5 서버 전용 한국어 인식 모델
    fs.readFile(path.join(dictDir, 'ko_dict.txt'), 'utf-8'), // 공통 한국어 사전
  ]);

  // 3. 서버 전용(onnxruntime-node) 추론 옵션 오버라이딩
  const cpuOptions: ort.InferenceSession.SessionOptions = { 
    executionProviders: ['cpu'], 
    // 🚀 FP16 모델과 onnxruntime-node 최적화 충돌(LayerNormFusion)을 막기 위해 basic으로 하향
    graphOptimizationLevel: 'basic' 
  };

  PaddleOcrService.prototype.initialize = async function (this: any) {
    this.detectionSession = await ort.InferenceSession.create(detBuffer, cpuOptions);
    this.recognitionSession = await ort.InferenceSession.create(recBuffer, cpuOptions);
    
    this.detectionService = new (global as any).paddleocr.DetectionService(ort, this.detectionSession, this.options.detection);
    this.recognitionService = new (global as any).paddleocr.RecognitionService(ort, this.recognitionSession, this.options.recognition);
    console.log('📡 [Server OCR] ONNX InferenceSession 생성 완료 (CPU)');
  };

  // 사전 텍스트 파싱 후 인덱스 보정 (+1칸 이동)
  // 수학적 역추적 결과: 모델은 'E'에 대해 인덱스 15를 출력합니다.
  // 원본 사전에서 'E'는 14번에 있으므로, 맨 앞에 1칸의 공백만 넣으면 완벽하게 일치합니다.
  const dictArray = dictText.replace(/\r/g, '').split('\n');
  dictArray.unshift('blank'); // +1칸 뒤로 밈

  // 4. 서비스 인스턴스 생성
  ocrServiceInstance = await PaddleOcrService.createInstance({
    ort: ort,
    detection: { modelBuffer: detBuffer, limitSideLen: 960 }, // 🚀 서버 성능을 활용해 탐지 해상도를 960으로 상향
    recognition: { 
      modelBuffer: recBuffer, 
      charactersDictionary: dictArray 
    },
  });

  return ocrServiceInstance;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json({ error: '이미지 파일이 없습니다.' }, { status: 400 });
    }

    const buffer = Buffer.from(await imageFile.arrayBuffer());

    // 1. OCR 엔진 가져오기 (초기화 또는 캐시된 인스턴스 반환)
    const ocrService = await getOcrService();

    // 2. Sharp를 사용한 이미지 전처리
    // 브라우저의 Canvas getImageData()와 동일하게 동작하도록 RGBA 배열을 추출합니다.
    // 너무 큰 이미지에 의한 지연을 막기 위해 1080px 내외로 안전하게 리사이징합니다.
    console.log('🖼️ [Server OCR] 이미지 전처리 중...');
    const { data, info } = await sharp(buffer)
      .resize({ width: 1080, height: 1080, fit: 'inside', withoutEnlargement: true })
      .ensureAlpha() // 투명도 채널(A)을 추가하여 RGBA(4채널) 포맷 보장
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Uint8Array 형태로 변환
    const pixelData = new Uint8Array(data);

    // 3. 실제 파이프라인(Detection -> Crop -> Recognition -> PostProcess) 실행
    console.log(`📡 [Server OCR] 추론 실행 중... (Size: ${info.width}x${info.height})`);
    const startTime = performance.now();
    
    const rawResults = await ocrService.recognize({ 
      width: info.width, 
      height: info.height, 
      data: pixelData 
    });

    const endTime = performance.now();
    console.log(`✅ [Server OCR] 추론 완료! 소요 시간: ${((endTime - startTime) / 1000).toFixed(2)}초`);

    // 4. 결과 데이터 정제
    const simplifiedResults = Array.isArray(rawResults) ? rawResults.map((item: any) => {
      let text = '';
      let score = 0;
      let box = [];

      // 결과 객체의 형태에 따라 파싱 (PaddleOCR 라이브러리 버전에 따른 호환성)
      if (item.text !== undefined) {
        text = String(item.text || '');
        score = Number(item.confidence || item.score || 0);
        box = Array.isArray(item.box) ? item.box : [];
      } else if (Array.isArray(item) && item.length >= 2) {
        box = item[0];
        text = String(Array.isArray(item[1]) ? item[1][0] : item[1]);
        score = Number(Array.isArray(item[1]) ? item[1][1] : 0);
      }
      return { text, score, box };
    }) : [];

    return NextResponse.json({
      success: true,
      message: '서버 추론 완료',
      results: simplifiedResults
    });

  } catch (error: any) {
    console.error('❌ Server OCR Critical Error:', error);
    return NextResponse.json({ error: error.message || '서버 내부 오류' }, { status: 500 });
  }
}
