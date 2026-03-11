'use client';

import { useState, useCallback, useRef } from 'react';
import * as ort from 'onnxruntime-web';
import { OCRResult, OCRState } from '../types';
import { preprocessImage } from '../utils/preprocess';

interface PaddleOcrInstance {
  initialize: () => Promise<void>;
  recognize: (input: { width: number; height: number; data: Uint8Array }) => Promise<any>;
  detectionSession: any;
  detectionService: any;
  recognitionService: any;
}

export const useOCR = () => {
  const [state, setState] = useState<OCRState>({
    isLoaded: false,
    isLoading: false,
    error: null,
  });
  
  const ocrServiceRef = useRef<PaddleOcrInstance | null>(null);
  const uvdocSessionRef = useRef<ort.InferenceSession | null>(null);
  const initializingRef = useRef(false);

  const initOCR = useCallback(async () => {
    if (ocrServiceRef.current || initializingRef.current) return;

    initializingRef.current = true;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    
    console.log('⏳ [1/4] UVDOC + OCR 엔진 초기화 시작...');
    const startTime = performance.now();

    try {
      const ortInstance = (window as any).ort || ort;
      if (!ortInstance) throw new Error('ONNX Runtime이 로드되지 않았습니다.');

      // OpenCV.js 준비 상태 대기
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

      // WASM 최적화 설정
      ortInstance.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/';
      ortInstance.env.wasm.numThreads = navigator.hardwareConcurrency || 4;
      ortInstance.env.logLevel = 'error';

      // 모델 파일 로드
      const responses = await Promise.all([
        fetch('/models/det_server_v5_web_final.onnx'),
        fetch('/models/rec_server_v5_web_final.onnx'),
        fetch('/models/uvdoc_v5_web_final.onnx'), // 🚀 UVDOC 모델 추가
        fetch('/models/dict.txt'),
      ]);

      for (const res of responses) {
        if (!res.ok) throw new Error(`모델 파일을 찾을 수 없습니다: ${res.url}`);
      }

      const [detModel, recModel, uvdocModel, dictText] = await Promise.all([
        responses[0].arrayBuffer(),
        responses[1].arrayBuffer(),
        responses[2].arrayBuffer(),
        responses[3].text(),
      ]);

      console.log(`✅ [2/4] 모든 모델 다운로드 완료 (${(performance.now() - startTime).toFixed(2)}ms)`);

      const dict = dictText.split('\n');
      const PaddleOcrService = (window as any).paddleocr?.PaddleOcrService;
      if (!PaddleOcrService) throw new Error('PaddleOcrService가 로드되지 않았습니다.');

      const sessionOptions = {
        executionProviders: [{ name: 'webgpu', preferredOutputFormat: 'float32' }, 'webgl', 'wasm'],
        graphOptimizationLevel: 'all'
      };

      // 1. UVDOC 세션 생성
      uvdocSessionRef.current = await ortInstance.InferenceSession.create(uvdocModel, sessionOptions);

      // 2. OCR 엔진 초기화 (Monkey-patch)
      PaddleOcrService.prototype.initialize = async function(this: any) {
        try {
          this.detectionSession = await ortInstance.InferenceSession.create(this.options.detection.modelBuffer, sessionOptions);
          this.recognitionSession = await ortInstance.InferenceSession.create(this.options.recognition.modelBuffer, sessionOptions);
          this.detectionService = new (window as any).paddleocr.DetectionService(ortInstance, this.detectionSession, this.options.detection);
          this.recognitionService = new (window as any).paddleocr.RecognitionService(ortInstance, this.recognitionSession, this.options.recognition);
        } catch (e) {
          throw e;
        }
      };

      ocrServiceRef.current = await PaddleOcrService.createInstance({
        ort: ortInstance,
        detection: { modelBuffer: detModel, limitSideLen: 1280, executionProviders: sessionOptions.executionProviders },
        recognition: { 
          modelBuffer: recModel, 
          executionProviders: sessionOptions.executionProviders,
          charactersDictionary: dict
        }
      });

      console.log(`✅ [3/4] UVDOC & OCR 엔진 준비 완료 (${((performance.now() - startTime) / 1000).toFixed(2)}초)`);
      setState({ isLoaded: true, isLoading: false, error: null });
    } catch (err: any) {
      console.error('❌ Init Error:', err);
      setState({ isLoaded: false, isLoading: false, error: `엔진 로드 실패: ${err?.message}` });
    } finally {
      initializingRef.current = false;
    }
  }, []);

  const executeOCR = useCallback(async (image: HTMLImageElement | HTMLCanvasElement): Promise<{ results: OCRResult[], debugImage: string }> => {
    if (!ocrServiceRef.current || !uvdocSessionRef.current) throw new Error('모델이 로드되지 않았습니다.');

    try {
      const totalStartTime = performance.now();
      const cv = (window as any).cv;
      
      let canvas: HTMLCanvasElement;
      if (image instanceof HTMLImageElement) {
        canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 생성 실패');
        ctx.drawImage(image, 0, 0);
      } else {
        canvas = image;
      }

      // 1. 기본 전처리
      const processedCanvas = preprocessImage(canvas);
      
      // 🚀 2. UVDOC 곡률 보정 단계
      console.log('🔄 UVDOC 곡률 보정 시작...');
      const uvdocStartTime = performance.now();
      
      // UVDOC 입력을 위한 512x512 리사이징 및 텐서 변환
      let src = cv.imread(processedCanvas);
      let resized = new cv.Mat();
      cv.resize(src, resized, new cv.Size(512, 512));
      cv.cvtColor(resized, resized, cv.COLOR_RGBA2RGB);
      
      // [1, 3, 512, 512] Float32 텐서 생성
      const inputData = new Float32Array(1 * 3 * 512 * 512);
      for (let i = 0; i < 512 * 512; i++) {
        inputData[i] = resized.data[i * 3] / 255.0; // R
        inputData[i + 512 * 512] = resized.data[i * 3 + 1] / 255.0; // G
        inputData[i + 2 * 512 * 512] = resized.data[i * 3 + 2] / 255.0; // B
      }
      
      const inputTensor = new ort.Tensor('float32', inputData, [1, 3, 512, 512]);
      const uvdocResults = await uvdocSessionRef.current.run({ 'image': inputTensor }); // 🚀 'x'에서 'image'로 수정
      const outputTensor = uvdocResults[Object.keys(uvdocResults)[0]];
      
      // 결과 텐서를 다시 이미지로 변환 (Dewarped Image)
      const dewarpedData = outputTensor.data as Float32Array;
      const dewarpedCanvas = document.createElement('canvas');
      dewarpedCanvas.width = 512;
      dewarpedCanvas.height = 512;
      const dCtx = dewarpedCanvas.getContext('2d')!;
      const dImgData = dCtx.createImageData(512, 512);
      
      for (let i = 0; i < 512 * 512; i++) {
        dImgData.data[i * 4] = Math.min(255, Math.max(0, dewarpedData[i] * 255)); // R
        dImgData.data[i * 4 + 1] = Math.min(255, Math.max(0, dewarpedData[i + 512 * 512] * 255)); // G
        dImgData.data[i * 4 + 2] = Math.min(255, Math.max(0, dewarpedData[i + 2 * 512 * 512] * 255)); // B
        dImgData.data[i * 4 + 3] = 255; // A
      }
      dCtx.putImageData(dImgData, 0, 0);
      
      src.delete(); resized.delete();
      console.log(`✅ UVDOC 완료 (${(performance.now() - uvdocStartTime).toFixed(1)}ms)`);

      // 3. OCR 실행 (보정된 이미지 사용)
      const pixelData = new Uint8Array(dImgData.data);
      const service = ocrServiceRef.current;
      
      const rawResults = await service.recognize({
        width: 512,
        height: 512,
        data: pixelData
      });

      const itemsToProcess = Array.isArray(rawResults) ? rawResults : (rawResults.lines || []);
      const parsedResults = itemsToProcess.map((item: any) => {
        let text = '', score = 0, box = [];
        if (item.text !== undefined) {
          text = item.text || '';
          score = item.confidence || item.score || 0;
          box = item.box || [];
        } else if (Array.isArray(item) && item.length >= 2) {
          box = item[0];
          text = Array.isArray(item[1]) ? item[1][0] : item[1];
          score = Array.isArray(item[1]) ? item[1][1] : 0;
        }

        // ROT-1 복호화
        let decodedText = '';
        if (text) {
          for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i);
            if (charCode > 65 && charCode <= 90) decodedText += String.fromCharCode(charCode - 1);
            else if (charCode === 65) decodedText += 'Z';
            else if (charCode > 97 && charCode <= 122) decodedText += String.fromCharCode(charCode - 1);
            else if (charCode === 97) decodedText += 'z';
            else decodedText += text[i];
          }
        }
        return { text: decodedText, score, box };
      });
      
      console.log(`✅ [인식 종료] 총 소요 시간: ${((performance.now() - totalStartTime) / 1000).toFixed(2)}초`);
      
      return { 
        results: parsedResults, 
        debugImage: dewarpedCanvas.toDataURL('image/jpeg') 
      };
    } catch (err) {
      console.error('❌ OCR/UVDOC Error:', err);
      throw new Error('문서 보정 및 분석에 실패했습니다.');
    }
  }, []);

  return { ...state, initOCR, executeOCR };
};
