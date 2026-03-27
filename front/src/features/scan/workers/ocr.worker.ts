import * as ort from 'onnxruntime-web';

// WASM 경로 설정 (Next.js public 폴더 기준)
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';

let detSession: ort.InferenceSession | null = null;
let recSession: ort.InferenceSession | null = null;

self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data;

  try {
    if (type === 'INIT') {
      const { detModelUrl, recModelUrl } = payload;
      
      const sessionOptions: ort.InferenceSession.SessionOptions = {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      };

      [detSession, recSession] = await Promise.all([
        ort.InferenceSession.create(detModelUrl, sessionOptions),
        ort.InferenceSession.create(recModelUrl, sessionOptions),
      ]);

      self.postMessage({ type: 'INIT_COMPLETE' });
    }

    if (type === 'PROCESS') {
      if (!detSession || !recSession) throw new Error('Models not initialized');

      const { imageData, width, height } = payload;
      
      // TODO: PaddleOCR 전용 이미지 전처리 및 추론 로직 구현
      // 현재는 온디바이스 OCR 구조를 잡는 스켈레톤 단계이므로 샘플 결과 반환
      const dummyText = "온디바이스(로컬)에서 인식된 테스트 텍스트입니다.";
      
      self.postMessage({ 
        type: 'PROCESS_COMPLETE', 
        payload: { text: dummyText, confidence: 0.95 } 
      });
    }
  } catch (error: any) {
    self.postMessage({ type: 'ERROR', payload: error.message });
  }
};
