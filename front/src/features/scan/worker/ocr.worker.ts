/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * OCR 추론용 Web Worker (GPU 가속 강제 활성화 버전)
 */

declare const importScripts: (...urls: string[]) => void;

try {
  importScripts(
    'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/ort.all.min.js',
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
      const { modelPaths } = payload; // 모델 경로만 전달받음
      const ortInstance = (self as any).ort;
      const { PaddleOcrService } = (self as any).paddleocr;

      if (!ortInstance || !PaddleOcrService) throw new Error('라이브러리 로드 실패');

      // 🚀 1. 모델 데이터를 워커에서 직접 Fetch (메인 스레드 메모리 보호)
      const loadModel = async (path: string) => {
        const res = await fetch(path);
        return await res.arrayBuffer();
      };

      console.log('[Worker] 모델 파일 직접 로딩 중...');
      let [detModel, recModel, dictText] = await Promise.all([
        loadModel(modelPaths.det),
        loadModel(modelPaths.rec),
        fetch(modelPaths.dict).then(res => res.text())
      ]);

      // 🚀 2. 엔진 설정 최적화
      ortInstance.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/';
      ortInstance.env.wasm.numThreads = 1; 
      
      // WebGPU 환경 설정 (강제 정리 활성화)
      ortInstance.env.webgpu.forceCleanup = true;

      // 🚀 GPU 전용 옵션 (WebGPU -> WebGL 순서)
      const gpuOptions = {
        executionProviders: [
          {
            name: 'webgpu',
            deviceOptions: { powerPreference: 'low-power' }
          },
          'webgl'
        ],
        graphOptimizationLevel: 'all',
        enableMemPattern: true,
        enableCpuMemArena: true,
      };

      // WASM 폴백 옵션 (안전 모드)
      const cpuOptions = { executionProviders: ['wasm'], graphOptimizationLevel: 'all' };

      PaddleOcrService.prototype.initialize = async function (this: any) {
        console.log('🧪 OCR GPU 세션 초기화 시도 중...');
        try {
          // 1차 시도: GPU (WebGPU)
          this.detectionSession = await ortInstance.InferenceSession.create(detModel, gpuOptions);
          this.recognitionSession = await ortInstance.InferenceSession.create(recModel, gpuOptions);
          console.log('📡 Engine Loaded: GPU (WebGPU/WebGL)');
        } catch (e) {
          console.warn('⚠️ GPU 초기화 실패, WASM으로 전환합니다:', e);
          // 2차 시도: CPU (WASM)
          this.detectionSession = await ortInstance.InferenceSession.create(detModel, cpuOptions);
          this.recognitionSession = await ortInstance.InferenceSession.create(recModel, cpuOptions);
          console.log('📡 Engine Loaded: WASM (Safe Mode)');
        }
        
        this.detectionService = new (self as any).paddleocr.DetectionService(ortInstance, this.detectionSession, this.options.detection);
        this.recognitionService = new (self as any).paddleocr.RecognitionService(ortInstance, this.recognitionSession, this.options.recognition);
      };

      // 🚀 인덱스 밀림 현상 방지: +1칸 당김 (수학적 역추적 결과 완벽 매핑)
      const dictArray = dictText.replace(/\r/g, '').split('\n');
      dictArray.unshift('blank');

      ocrService = await PaddleOcrService.createInstance({
        ort: ortInstance,
        detection: { modelBuffer: detModel, limitSideLen: 320 },
        recognition: { modelBuffer: recModel, charactersDictionary: dictArray },
      });

      // 🚀 [안정성 조치] 세션 생성 후 불필요한 모델 버퍼 즉시 폐기
      (detModel as any) = null;
      (recModel as any) = null;
      (dictText as any) = null;

      console.log('[Worker] 엔진 초기화 완료 및 원본 버퍼 해제');
      self.postMessage({ type: 'INIT_DONE' });
    }

    if (type === 'RECOGNIZE') {
      let { width, height, data } = payload;
      console.log(`[Worker] 추론 시작... (Size: ${width}x${height})`);
      
      const rawResults = await ocrService.recognize({ width, height, data });
      
      // 🚀 데이터 극단적 다이어트: 텍스트와 스코어만 전송 (박스 좌표 제거)
      const simplifiedResults = Array.isArray(rawResults) ? rawResults.map((item: any) => {
        let text = '';
        let score = 0;
        if (item.text !== undefined) {
          text = String(item.text || '').substring(0, 100);
          score = Number(item.confidence || item.score || 0);
        } else if (Array.isArray(item) && item.length >= 2) {
          text = String(Array.isArray(item[1]) ? item[1][0] : item[1]).substring(0, 100);
          score = Number(Array.isArray(item[1]) ? item[1][1] : 0);
        }
        return { text, score }; // box 제거
      }) : [];

      console.log(`[Worker] 추론 완료! 텍스트 개수: ${simplifiedResults.length}`);
      
      // 🚀 워커 내부 상세 로그 복구
      if (simplifiedResults.length > 0) {
        simplifiedResults.forEach((res, idx) => {
          console.log(`  └ [${idx + 1}] 인식됨: "${res.text}" (${(res.score * 100).toFixed(1)}%)`);
        });
      }

      self.postMessage({ type: 'RECOGNIZE_DONE', payload: simplifiedResults });

      // 메모리 강제 해제
      (payload as any).data = null;
      data = null as any;
    }
  } catch (error: any) {
    const msg = (error as any)?.message || 'Unknown Error';
    self.postMessage({ type: 'ERROR', payload: msg });
  }
};
