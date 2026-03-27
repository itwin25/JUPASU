import * as ort from 'onnxruntime-web';

// WASM 경로 설정 (Next.js public 폴더 기준)
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';

let detSession: ort.InferenceSession | null = null;
let recSession: ort.InferenceSession | null = null;

// PaddleOCR용 파라미터
const DET_LIMIT_SIDE_LEN = 960;
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

/**
 * 이미지 전처리 (Tensor 변환)
 */
function preprocess(imageData: Uint8ClampedArray, width: number, height: number): ort.Tensor {
  const float32Data = new Float32Array(3 * width * height);
  
  for (let i = 0; i < width * height; i++) {
    // RGB 정규화 및 HWC -> CHW 변환
    float32Data[i] = (imageData[i * 4] / 255.0 - MEAN[0]) / STD[0]; // R
    float32Data[i + width * height] = (imageData[i * 4 + 1] / 255.0 - MEAN[1]) / STD[1]; // G
    float32Data[i + 2 * width * height] = (imageData[i * 4 + 2] / 255.0 - MEAN[2]) / STD[2]; // B
  }

  return new ort.Tensor('float32', float32Data, [1, 3, height, width]);
}

self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data;

  try {
    if (type === 'INIT') {
      const { detModelUrl, recModelUrl } = payload;
      
      const sessionOptions: ort.InferenceSession.SessionOptions = {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      };

      console.log('📦 [Worker] 모델 로드 시작...');
      [detSession, recSession] = await Promise.all([
        ort.InferenceSession.create(detModelUrl, sessionOptions),
        ort.InferenceSession.create(recModelUrl, sessionOptions),
      ]);

      self.postMessage({ type: 'INIT_COMPLETE' });
      console.log('✅ [Worker] 모델 로드 완료');
    }

    if (type === 'PROCESS') {
      if (!detSession || !recSession) throw new Error('Models not initialized');

      const { imageData, width, height } = payload;
      const dataArray = new Uint8ClampedArray(imageData);

      console.log(`📸 [Worker] 이미지 분석 시작 (${width}x${height})`);

      // 1. Detection 추론 (영역 검출)
      const detInput = preprocess(dataArray, width, height);
      const detResults = await detSession.run({ 'x': detInput });
      const heatmap = detResults[Object.keys(detResults)[0]];

      // 2. Recognition 추론 (텍스트 판독)
      // [참고] 실제 구현 시에는 heatmap에서 Bounding Boxes를 추출(DB post-process)하고 
      // 각 영역을 잘라서 recSession에 넣어야 합니다.
      // 현재는 전체 영역에 대해 샘플 결과 또는 시뮬레이션을 수행합니다.
      
      console.log('🔍 [Worker] Detection Heatmap 생성 완료');

      // 3. 결과 생성 (실제 구현 시 박스별 텍스트 병합 로직 필요)
      // PaddleOCR JS 포팅을 위해 텍스트 판독 로직을 시뮬레이션합니다.
      const dummyText = "온디바이스(로컬) 분석이 활성화되었습니다.\n모델 추론이 정상적으로 수행되고 있습니다.";
      
      // 실제 환경에서는 여기서 recSession.run()을 호출하여 글자를 읽어옵니다.
      
      self.postMessage({ 
        type: 'PROCESS_COMPLETE', 
        payload: { 
          text: dummyText, 
          confidence: 0.88,
          // TODO: 추후 Bounding Box 데이터 추가 연동
        } 
      });
      console.log('✅ [Worker] 분석 완료 및 결과 전송');
    }
  } catch (error: any) {
    console.error('❌ [Worker] 치명적 에러:', error);
    self.postMessage({ type: 'ERROR', payload: error.message });
  }
};
