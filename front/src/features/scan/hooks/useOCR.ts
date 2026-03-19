'use client';

import { useState, useCallback, useRef } from 'react';
import * as ort from 'onnxruntime-web'; // 이건 패키지 방식 유지
import { OCRResult, OCRState } from '../types';
import { preprocessImage } from '../utils/preprocess';

// PaddleOCR 라이브러리를 위한 인터페이스 정의
interface PaddleOcrInstance {
  initialize: () => Promise<void>;
  recognize: (input: { width: number; height: number; data: Uint8Array }) => Promise<any>;
  detectionSession: { handler: { kind: string } };
  detectionService: { run: any };
  recognitionService: { run: any };
}

export const useOCR = () => {
  const [state, setState] = useState<OCRState>({
    isLoaded: false,
    isLoading: false,
    error: null,
  });
  
  const ocrServiceRef = useRef<PaddleOcrInstance | null>(null);
  const initializingRef = useRef(false);

  const initOCR = useCallback(async () => {
    if (ocrServiceRef.current || initializingRef.current) return;

    initializingRef.current = true;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    
    console.log('⏳ [1/4] OCR 모델 및 엔진 초기화 시작...');
    const startTime = performance.now();

    try {
      const ortInstance = (window as any).ort || ort;
      if (!ortInstance) {
        throw new Error('ONNX Runtime이 로드되지 않았습니다.');
      }

      // 🚨 OpenCV.js (Script 방식) 준비 상태 대기
      console.log('⏳ [1.2/4] OpenCV.js 로딩 감시 중...');
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('OpenCV 로딩 시간 초과')), 15000);
        const check = () => {
          const cv = (window as any).cv;
          if (cv && cv.Mat) {
            clearTimeout(timeout);
            resolve();
          } else {
            setTimeout(check, 200);
          }
        };
        check();
      });
      console.log('✅ [1.5/4] OpenCV.js 준비 완료');

      // WASM 최적화 설정
      ortInstance.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/';
      ortInstance.env.wasm.numThreads = navigator.hardwareConcurrency || 4;

      // 모델 파일 로드
      const responses = await Promise.all([
        fetch('/models/det.onnx'),
        fetch('/models/rec.onnx'),
        fetch('/models/dict.txt'),
      ]);

      for (const res of responses) {
        if (!res.ok) throw new Error(`모델 파일을 찾을 수 없습니다: ${res.url}`);
      }

      const [detModel, recModel, dictText] = await Promise.all([
        responses[0].arrayBuffer(),
        responses[1].arrayBuffer(),
        responses[2].text(),
      ]);
      console.log(`✅ [2/4] 모델 파일 다운로드 완료 (${(performance.now() - startTime).toFixed(2)}ms)`);

      const dict = dictText.split('\n');
      const PaddleOcrService = (window as any).paddleocr?.PaddleOcrService;

      if (!PaddleOcrService) throw new Error('PaddleOcrService가 로드되지 않았습니다.');

      // 라이브러리 패치
      PaddleOcrService.prototype.initialize = async function(this: any) {
        try {
          const sessionOptions = {
            executionProviders: ['wasm'],
            graphOptimizationLevel: 'all'
          };
          this.detectionSession = await ortInstance.InferenceSession.create(this.options.detection.modelBuffer, sessionOptions);
          this.detectionService = new (window as any).paddleocr.DetectionService(ortInstance, this.detectionSession, this.options.detection);
          this.recognitionSession = await ortInstance.InferenceSession.create(this.options.recognition.modelBuffer, sessionOptions);
          this.recognitionService = new (window as any).paddleocr.RecognitionService(ortInstance, this.recognitionSession, this.options.recognition);
        } catch (e) {
          console.error("Monkey-patched initialize error:", e);
          throw e;
        }
      };

      const engineStartTime = performance.now();
      ocrServiceRef.current = await PaddleOcrService.createInstance({
        ort: ortInstance,
        detection: { modelBuffer: detModel, executionProviders: ['wasm'] },
        recognition: { 
          modelBuffer: recModel, 
          executionProviders: ['wasm'],
          charactersDictionary: dict
        }
      });

      if (ocrServiceRef.current) {
        console.log(`✅ [3/4] OCR 엔진 준비 완료 (${(performance.now() - engineStartTime).toFixed(2)}ms)`);
        console.log(`🚀 [4/4] 모델 전체 로드 완료 (총 ${((performance.now() - startTime) / 1000).toFixed(2)}초 소요)`);
      }

      setState({ isLoaded: true, isLoading: false, error: null });
    } catch (err: any) {
      console.error('❌ OCR Initialization Error:', err);
      setState({ isLoaded: false, isLoading: false, error: `OCR 모델 로드 실패: ${err?.message || '알 수 없는 오류'}` });
    } finally {
      initializingRef.current = false;
    }
  }, []);

  const executeOCR = useCallback(async (image: HTMLImageElement | HTMLCanvasElement): Promise<{ results: OCRResult[], debugImage: string }> => {
    if (!ocrServiceRef.current) throw new Error('OCR 모델이 로드되지 않았습니다.');

    try {
      const totalStartTime = performance.now();
      
      let canvas: HTMLCanvasElement;
      if (image instanceof HTMLImageElement) {
        canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context 생성 실패');
        ctx.drawImage(image, 0, 0);
      } else {
        canvas = image;
      }

      const preprocessStartTime = performance.now();
      const processedCanvas = preprocessImage(canvas);
      const pCtx = processedCanvas.getContext('2d');
      if (!pCtx) throw new Error('Processed Canvas context 생성 실패');
      
      const imageData = pCtx.getImageData(0, 0, processedCanvas.width, processedCanvas.height);
      const pixelData = new Uint8Array(imageData.data);
      console.log(`🔍 [1/3] 이미지 전처리 완료 - ${(performance.now() - preprocessStartTime).toFixed(2)}ms`);

      const service = ocrServiceRef.current;
      let detTime = 0, recTime = 0, detBoxCount = 0;
      
      const originalDetRun = service.detectionService.run.bind(service.detectionService);
      const originalRecRun = service.recognitionService.run.bind(service.recognitionService);

      service.detectionService.run = async (...args: any[]) => {
        const start = performance.now();
        const res = await originalDetRun(...args);
        detTime = performance.now() - start;
        detBoxCount = res ? res.length : 0;
        return res;
      };

      service.recognitionService.run = async (...args: any[]) => {
        const start = performance.now();
        const res = await originalRecRun(...args);
        recTime = performance.now() - start;
        return res;
      };

      const rawResults = await service.recognize({
        width: processedCanvas.width,
        height: processedCanvas.height,
        data: pixelData
      });
      
      service.detectionService.run = originalDetRun;
      service.recognitionService.run = originalRecRun;

      console.log(`🤖 [2/3] 인공지능 추론 완료 (WASM) - ${(performance.now() - preprocessStartTime).toFixed(2)}ms`);
      console.log(`   ├─ 위치 탐지 (DET): ${detTime.toFixed(2)}ms (박스: ${detBoxCount}개)`);
      console.log(`   └─ 글자 해독 (REC): ${recTime.toFixed(2)}ms`);
      
      const isArray = Array.isArray(rawResults);
      const itemsToProcess = isArray ? rawResults : (rawResults.lines || []);

      const parsedResults = itemsToProcess.map((item: any) => {
        let text = item.text || '', decodedText = '';
        for (let i = 0; i < text.length; i++) {
          const charCode = text.charCodeAt(i);
          if (charCode > 65 && charCode <= 90) decodedText += String.fromCharCode(charCode - 1);
          else if (charCode === 65) decodedText += 'Z';
          else if (charCode > 97 && charCode <= 122) decodedText += String.fromCharCode(charCode - 1);
          else if (charCode === 97) decodedText += 'z';
          else decodedText += text[i];
        }
        return { text: decodedText, score: item.confidence || item.score || 0, box: item.box || [] };
      });
      
      console.log(`✨ [3/3] 결과 복호화 완료:`, parsedResults.map(r => r.text));
      console.log(`✅ [인식 종료] 총 소요 시간: ${((performance.now() - totalStartTime) / 1000).toFixed(2)}초`);
      
      return { 
        results: parsedResults, 
        debugImage: processedCanvas.toDataURL('image/jpeg') 
      };
    } catch (err) {
      console.error('❌ OCR Execution Error:', err);
      throw new Error('텍스트 분석에 실패했습니다.');
    }
  }, []);

  return { ...state, initOCR, executeOCR };
};
