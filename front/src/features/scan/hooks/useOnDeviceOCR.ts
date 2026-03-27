import { useState, useEffect, useRef, useCallback } from 'react';
import { refineApi } from '../api/refine.api';
import { RefineTask, RefineResponse } from '../types/refine.types';

export interface OnDeviceOCRResult {
  success: boolean;
  refined?: RefineResponse;
  error?: string;
  isProcessing: boolean;
  isReady: boolean;
}

export const useOnDeviceOCR = () => {
  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Web Worker 초기화
    const worker = new Worker(
      new URL('../workers/ocr.worker.ts', import.meta.url)
    );
    workerRef.current = worker;

    const handleMessage = (e: MessageEvent) => {
      const { type } = e.data;
      if (type === 'INIT_COMPLETE') {
        setIsReady(true);
        console.log('✅ OnDevice OCR 모델 로드 완료');
      }
      if (type === 'ERROR') {
        console.error('❌ OnDevice OCR Worker 에러:', e.data.payload);
      }
    };

    worker.addEventListener('message', handleMessage);

    // 모델 초기화 요청
    const origin = window.location.origin;
    worker.postMessage({
      type: 'INIT',
      payload: {
        detModelUrl: `${origin}/models/mobile/det_mobile.onnx`,
        recModelUrl: `${origin}/models/mobile/rec_mobile_ko.onnx`,
        dictUrl: `${origin}/models/dicts/ko_dict.txt`
      }
    });

    return () => {
      worker.removeEventListener('message', handleMessage);
      worker.terminate();
    };
  }, []);

  const recognize = useCallback(async (
    canvas: HTMLCanvasElement, 
    task: RefineTask = 'LABEL_SCAN'
  ): Promise<OnDeviceOCRResult> => {
    if (!workerRef.current || !isReady) {
      return { success: false, isProcessing: false, isReady, error: 'OCR 준비가 되지 않았습니다.' };
    }

    return new Promise((resolve) => {
      setIsProcessing(true);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsProcessing(false);
        return resolve({ success: false, isProcessing: false, isReady, error: '캔버스 컨텍스트를 가져올 수 없습니다.' });
      }

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const onWorkerMessage = async (e: MessageEvent) => {
        const { type, payload } = e.data;

        if (type === 'PROCESS_COMPLETE') {
          workerRef.current?.removeEventListener('message', onWorkerMessage);
          
          try {
            // [Brain] 추출된 텍스트를 백엔드 LLM으로 보내 정제
            const refinedData = await refineApi.refine(task, payload.text);
            
            setIsProcessing(false);
            resolve({
              success: true,
              refined: refinedData,
              isProcessing: false,
              isReady
            });
          } catch (err: any) {
            console.error('❌ OCR 정제 에러:', err);
            setIsProcessing(false);
            resolve({
              success: false,
              error: '텍스트 정제 중 오류가 발생했습니다.',
              isProcessing: false,
              isReady
            });
          }
        }

        if (type === 'ERROR') {
          workerRef.current?.removeEventListener('message', onWorkerMessage);
          setIsProcessing(false);
          resolve({
            success: false,
            error: payload,
            isProcessing: false,
            isReady
          });
        }
      };

      workerRef.current.addEventListener('message', onWorkerMessage);

      // 워커로 이미지 데이터 전송 (Transferable Object 활용)
      workerRef.current.postMessage({
        type: 'PROCESS',
        payload: {
          imageData: imageData.data.buffer,
          width: canvas.width,
          height: canvas.height
        }
      }, [imageData.data.buffer]);
    });
  }, [isReady]);

  return { recognize, isReady, isProcessing };
};
