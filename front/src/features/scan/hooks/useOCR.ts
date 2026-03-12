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
      // 1. 모델 데이터 로드 (캐시 우선)
      const modelPaths = {
        det: '/models/optimized_final/PP-OCRv5_mobile_det_optimized.onnx',
        rec: '/models/optimized_final/hfonnx_latin_PP-OCRv5_mobile_rec_optimized.onnx',
        dict: '/models/optimized_final/dicts/latin_dict.txt',
      };

      const loadFile = async (key: string, path: string, isText = false) => {
        const cached = await modelCache.get(key);
        if (cached) return cached;
        const response = await fetch(path);
        if (!response.ok) throw new Error(`${key} 다운로드 실패`);
        const data = isText ? await response.text() : await response.arrayBuffer();
        await modelCache.set(key, data);
        return data;
      };

      const [detModel, recModel, dictText] = await Promise.all([
        loadFile('det_model_latin_v15_mobile', modelPaths.det) as Promise<ArrayBuffer>,
        loadFile('rec_model_latin_v15_mobile', modelPaths.rec) as Promise<ArrayBuffer>,
        loadFile('dict_file_latin_v16_mobile', modelPaths.dict, true) as Promise<string>,
      ]);

      // 2. Worker 생성 및 초기화
      const worker = new Worker(new URL('../worker/ocr.worker.ts', import.meta.url));
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

      // Transferable: 모델 버퍼 소유권을 Worker로 이전 (복사 비용 0)
      worker.postMessage(
        {
          type: 'INIT',
          payload: {
            detModel,
            recModel,
            dict: dictText.split('\n'),
          },
        },
        [detModel, recModel],
      );

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

        // 1. 전처리 (메인 스레드에서 수행 - 현재는 건너뛰기 설정됨)
        const processedCanvas = preprocessImage(canvas);
        const dCtx = processedCanvas.getContext('2d', { willReadFrequently: true })!;
        const dImgData = dCtx.getImageData(0, 0, processedCanvas.width, processedCanvas.height);

        // 2. Worker에 추론 요청
        const pixelData = new Uint8Array(dImgData.data);
        const worker = workerRef.current;

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

        // Transferable: 픽셀 데이터 버퍼 소유권을 Worker로 이전 (복사 비용 0)
        worker.postMessage(
          {
            type: 'RECOGNIZE',
            payload: {
              width: processedCanvas.width,
              height: processedCanvas.height,
              data: pixelData,
            },
          },
          [pixelData.buffer],
        );

        const rawResults = await recognitionPromise;

        // 3. 결과 후처리 (복호화 등)

        const itemsToProcess: any[] = Array.isArray(rawResults)
          ? rawResults
          : (rawResults as any).lines || [];

        const parsedResults = itemsToProcess.map((item: any) => {
          let text = '',
            score = 0,
            box = [];
          if (item.text !== undefined) {
            text = item.text || '';
            score = item.confidence || item.score || 0;
            box = item.box || [];
          } else if (Array.isArray(item) && item.length >= 2) {
            box = item[0];
            text = Array.isArray(item[1]) ? item[1][0] : item[1];
            score = Array.isArray(item[1]) ? item[1][1] : 0;
          }

          return { text, score, box };
        });

        console.log(
          `✅ [인식 종료] 총 소요 시간: ${((performance.now() - totalStartTime) / 1000).toFixed(2)}초`,
        );

        return {
          results: parsedResults,
          debugImage: processedCanvas.toDataURL('image/jpeg'),
        };
      } catch (err) {
        console.error('❌ OCR/Worker Error:', err);
        throw new Error('분석에 실패했습니다.');
      }
    },
    [],
  );

  return { ...state, initOCR, executeOCR };
};
