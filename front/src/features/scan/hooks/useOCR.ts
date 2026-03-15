/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { OCRResult, OCRState } from '../types';
import { preprocessImage } from '../utils/preprocess';
import { modelCache } from '@/utils/model-cache';

export const useOCR = () => {
  const [state, setState] = useState<OCRState>({
    isLoaded: false,
    isLoading: false,
    error: null,
  });

  const workerRef = useRef<Worker | null>(null);
  const initializingRef = useRef(false);

  // 컴포넌트 언마운트 시 Worker 정리
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const initOCR = useCallback(async () => {
    if (workerRef.current || initializingRef.current) return;

    initializingRef.current = true;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    console.log('🚀 [OCR 엔진 초기화 시작 - Web Worker]');
    const startTime = performance.now();

    try {
      const version = Date.now();
      
      // 🚀 모델 경로만 설정 (데이터는 워커가 직접 로드)
      const modelPaths = {
        det: `${window.location.origin}/models/mobile/det_mobile.onnx?v=${version}`,
        rec: `${window.location.origin}/models/mobile/rec_mobile_ko.onnx?v=${version}`,
        dict: `${window.location.origin}/models/dicts/ko_dict.txt?v=${version}`,
      };

      // 2. Worker 생성
      const workerUrl = new URL('../worker/ocr.worker.ts', import.meta.url);
      workerUrl.searchParams.set('v', version.toString());
      
      let worker = new Worker(workerUrl);
      workerRef.current = worker;

      const initPromise = new Promise<void>((resolve, reject) => {
        const handler = (e: MessageEvent) => {
          if (e.data.type === 'INIT_DONE') {
            worker.removeEventListener('message', handler);
            resolve();
          } else if (e.data.type === 'ERROR') {
            worker.removeEventListener('message', handler);
            reject(new Error(String(e.data.payload)));
          }
        };
        worker.addEventListener('message', handler);
      });

      // 🚀 워커로 경로만 전달 (메인 스레드 메모리 사용량 0MB)
      worker.postMessage({
        type: 'INIT',
        payload: { modelPaths },
      });

      await initPromise;

      console.log(
        `✅ 엔진 준비 완료 (총 소요 시간: ${((performance.now() - startTime) / 1000).toFixed(2)}초)`,
      );
      setState({ isLoaded: true, isLoading: false, error: null });
    } catch (err: unknown) {
      console.error('❌ OCR Init Error:', err);
      const msg = err instanceof Error ? err.message : '알 수 없는 오류';
      setState({ isLoaded: false, isLoading: false, error: `엔진 로드 실패: ${msg}` });
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    } finally {
      initializingRef.current = false;
    }
  }, []);

  const executeOCR = useCallback(
    async (
      image: HTMLImageElement | HTMLCanvasElement,
    ): Promise<{ results: OCRResult[]; debugImage: string }> => {
      if (!workerRef.current) throw new Error('OCR 엔진이 로드되지 않았습니다.');

      try {
        const totalStartTime = performance.now();

        // 1. 이미지 리사이징 (아이폰 사파리 메모리 최적화 - 초저용량 320px)
        const MAX_DIMENSION = 320;
        let targetWidth = image instanceof HTMLImageElement ? image.naturalWidth : image.width;
        let targetHeight = image instanceof HTMLImageElement ? image.naturalHeight : image.height;

        if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
          const ratio = Math.min(MAX_DIMENSION / targetWidth, MAX_DIMENSION / targetHeight);
          targetWidth = Math.round(targetWidth * ratio);
          targetHeight = Math.round(targetHeight * ratio);
        }

        let resizeCanvas: HTMLCanvasElement | null = document.createElement('canvas');
        resizeCanvas.width = targetWidth;
        resizeCanvas.height = targetHeight;
        const ctx = resizeCanvas.getContext('2d', { alpha: false });
        if (!ctx) throw new Error('Canvas 생성 실패');
        ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

        // 2. 전처리
        let processedCanvas: HTMLCanvasElement | null = preprocessImage(resizeCanvas);
        const dCtx = processedCanvas.getContext('2d', { willReadFrequently: true })!;
        let dImgData: ImageData | null = dCtx.getImageData(0, 0, processedCanvas.width, processedCanvas.height);

        // 3. Worker에 추론 요청
        let pixelData: Uint8Array | null = new Uint8Array(dImgData.data);
        const worker = workerRef.current;

        // ImageData 즉시 해제
        dImgData = null;

        const recognitionPromise = new Promise<any>((resolve, reject) => {
          const handler = (e: MessageEvent) => {
            if (e.data.type === 'RECOGNIZE_DONE') {
              worker.removeEventListener('message', handler);
              resolve(e.data.payload);
            } else if (e.data.type === 'ERROR') {
              worker.removeEventListener('message', handler);
              reject(new Error(String(e.data.payload)));
            }
          };
          worker.addEventListener('message', handler);
        });

        // Transferable: 픽셀 데이터 버퍼 소유권을 Worker로 이전
        const buffer = pixelData.buffer;
        worker.postMessage(
          {
            type: 'RECOGNIZE',
            payload: {
              width: processedCanvas.width,
              height: processedCanvas.height,
              data: pixelData,
            },
          },
          [buffer],
        );

        // 픽셀 데이터 참조 해제
        pixelData = null;

        const rawResults = await recognitionPromise;

        // 🚀 [발열 대책] 워커를 종료하지 않고 유지합니다 (Singleton)
        const debugImageUrl = ''; 

        // 5. 리소스 정리 (캔버스 버퍼 해제)
        if (resizeCanvas) {
          resizeCanvas.width = 0;
          resizeCanvas.height = 0;
          resizeCanvas = null;
        }
        if (processedCanvas) {
          processedCanvas.width = 0;
          processedCanvas.height = 0;
          processedCanvas = null;
        }

        return {
          results: rawResults,
          debugImage: debugImageUrl,
        };
      } catch (err) {
        console.error('❌ OCR/Worker Error:', err);
        throw new Error('분석에 실패했습니다.');
      }
    },
    [],
  );

  const executeServerOCR = useCallback(async (image: HTMLImageElement | HTMLCanvasElement): Promise<any> => {
    try {
      console.log('📡 [Server OCR] 서버 분석 요청 중...');
      
      // 1. 이미지를 Blob으로 변환
      let canvas: HTMLCanvasElement;
      if (image instanceof HTMLImageElement) {
        canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        canvas.getContext('2d')?.drawImage(image, 0, 0);
      } else {
        canvas = image;
      }

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      if (!blob) throw new Error('이미지 변환 실패');

      // 2. FormData 생성
      const formData = new FormData();
      formData.append('image', blob, 'scan.jpg');

      // 3. 서버 API 호출
      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('서버 분석 응답 실패');
      
      const data = await response.json();
      console.log('✅ [Server OCR] 결과 수신:', data);
      return data;
    } catch (err) {
      console.error('❌ Server OCR Error:', err);
      throw err;
    }
  }, []);

  return { ...state, initOCR, executeOCR, executeServerOCR };
};
