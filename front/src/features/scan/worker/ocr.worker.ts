/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * OCR 추론용 Web Worker (GPU 가속 강제 활성화 버전)
 */

try {
  importScripts(
    'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/ort.all.min.js',
    'https://cdn.jsdelivr.net/npm/paddleocr@1.0.7/dist/index.js',
  );
} catch (e) {
  console.error('Worker Script Import Error:', e);
}

let ocrService: any = null;

self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data;

  try {
    if (type === 'INIT') {
      const { detModel, recModel, dict } = payload;

      const ortInstance = (self as any).ort;

      const { PaddleOcrService } = (self as any).paddleocr;

      if (!ortInstance || !PaddleOcrService) throw new Error('라이브러리 로드 실패');

      // ONNX Runtime 환경 설정
      ortInstance.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/';
      ortInstance.env.wasm.numThreads = 4;

      // 가속 백엔드 등록 강제 허용
      ortInstance.env.allowPlatformNative = true;

      // 1차 시도: 오직 GPU만 허용 (WASM 제외)
      const gpuOnlyOptions = {
        executionProviders: [{ name: 'webgpu' }, { name: 'webgl' }],
        graphOptimizationLevel: 'all',
      };

      PaddleOcrService.prototype.initialize = async function (this: any) {
        console.log('🧪 WebGPU/WebGL 전용 세션 생성 시도 중...');
        try {
          // GPU로 세션 생성 시도
          this.detectionSession = await ortInstance.InferenceSession.create(
            this.options.detection.modelBuffer,
            gpuOnlyOptions,
          );
          this.recognitionSession = await ortInstance.InferenceSession.create(
            this.options.recognition.modelBuffer,
            gpuOnlyOptions,
          );

          const getEngine = (session: any) => session.executionProviders?.[0] || 'GPU';
          console.log(
            `📡 Success! GPU 가속 활성화됨 (Engine: ${getEngine(this.detectionSession)})`,
          );

          this.detectionService = new (self as any).paddleocr.DetectionService(
            ortInstance,
            this.detectionSession,
            this.options.detection,
          );

          this.recognitionService = new (self as any).paddleocr.RecognitionService(
            ortInstance,
            this.recognitionSession,
            this.options.recognition,
          );
        } catch (gpuError: unknown) {
          const errorMsg = (gpuError as any)?.message || 'Unknown GPU error';
          console.warn('⚠️ GPU 가속 실패 원인:', errorMsg);
          console.log('🔄 안전 모드(WASM)로 폴백하여 다시 시도합니다...');

          // GPU 실패 시 2차 시도: WASM
          const fallbackOptions = { executionProviders: ['wasm'], graphOptimizationLevel: 'all' };
          this.detectionSession = await ortInstance.InferenceSession.create(
            this.options.detection.modelBuffer,
            fallbackOptions,
          );
          this.recognitionSession = await ortInstance.InferenceSession.create(
            this.options.recognition.modelBuffer,
            fallbackOptions,
          );

          this.detectionService = new (self as any).paddleocr.DetectionService(
            ortInstance,
            this.detectionSession,
            this.options.detection,
          );

          this.recognitionService = new (self as any).paddleocr.RecognitionService(
            ortInstance,
            this.recognitionSession,
            this.options.recognition,
          );
          console.log('📡 Engine Loaded: wasm (Safe Mode)');
        }
      };

      ocrService = await PaddleOcrService.createInstance({
        ort: ortInstance,
        detection: { modelBuffer: detModel, limitSideLen: 960 },
        recognition: { modelBuffer: recModel, charactersDictionary: dict },
      });

      self.postMessage({ type: 'INIT_DONE' });
    }

    if (type === 'RECOGNIZE') {
      const { width, height, data } = payload;
      const rawResults = await ocrService.recognize({ width, height, data });
      self.postMessage({ type: 'RECOGNIZE_DONE', payload: rawResults });
    }
  } catch (error: any) {
    const msg = (error as any)?.message || 'Unknown Error';
    self.postMessage({ type: 'ERROR', payload: msg });
  }
};
