import { useState, useEffect, useRef, useCallback } from 'react';
import { refineApi } from '../api/refine.api';
import { RefineTask } from '../types/refine.types';

export interface OnDeviceOCRResult {
  success: boolean;
  refined?: Record<string, unknown>;
  error?: string;
  isProcessing: boolean;
  isReady: boolean;
}

/**
 * WebGPU 가속을 사용하는 온디바이스 OCR 훅
 */
export const useOnDeviceGPUOCR = () => {
  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    try {
      console.log('🏗️ [Main] GPU OCR 워커 생성 시작...');
      // GPU 전용 워커 로드
      const worker = new Worker(`/workers/ocr-gpu.worker.js?v=${Date.now()}`);
      workerRef.current = worker;

      const handleMessage = (e: MessageEvent) => {
        const { type, payload } = e.data;
        console.log(`📩 [Main-GPU] 메시지 수신: type=${type}`, payload);

        if (type === 'INIT_COMPLETE') {
          setIsReady(true);
          console.log('🚀 [Main-GPU] WebGPU OCR 서비스 활성화 준비 완료!');
        }
        if (type === 'ERROR') {
          console.error('❌ [Main-GPU] 워커 내부 에러:', payload);
        }
        if (type === 'LOG') {
          console.log(`[GPU Worker Log] ${payload}`);
        }
      };

      worker.addEventListener('message', handleMessage);

      const origin = window.location.origin;
      worker.postMessage({
        type: 'INIT',
        payload: {
          // fp16 최적화된 서버 모델로 Detection 모델 교체
          detModelUrl: `${origin}/models/mobile/fp16/det_server.onnx`,
          recModelUrl: `${origin}/models/server/rec_latin.onnx`,
          dictUrl: `${origin}/models/dicts/latin_dict.txt`,
        },
      });

      return () => {
        console.log('🗑️ [Main-GPU] 워커 정리');
        worker.removeEventListener('message', handleMessage);
        worker.terminate();
      };
    } catch (err) {
      console.error('❌ [Main-GPU] 워커 초기화 에러:', err);
    }
  }, []);

  const recognize = useCallback(
    async (
      canvas: HTMLCanvasElement,
      task: RefineTask = 'LABEL_SCAN',
    ): Promise<OnDeviceOCRResult> => {
      const worker = workerRef.current;
      if (!worker || !isReady) {
        return {
          success: false,
          isProcessing: false,
          isReady,
          error: 'GPU OCR 준비가 되지 않았습니다.',
        };
      }

      return new Promise((resolve) => {
        setIsProcessing(true);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsProcessing(false);
          return resolve({
            success: false,
            isProcessing: false,
            isReady,
            error: '컨텍스트 획득 실패',
          });
        }

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const onWorkerMessage = async (e: MessageEvent) => {
          const { type, payload } = e.data;

          if (type === 'PROCESS_COMPLETE') {
            console.log('✅ [Main-GPU] 워커 처리 완료, 수신 데이터:', payload);
            worker.removeEventListener('message', onWorkerMessage);
            try {
              const refinedData = await refineApi.refine(task, payload.text);
              console.log('✨ [Main-GPU] AI 정제 완료:', refinedData);
              setIsProcessing(false);
              resolve({ success: true, refined: refinedData, isProcessing: false, isReady });
            } catch (err) {
              console.error('❌ [Main-GPU] 정제 에러:', err);
              setIsProcessing(false);
              resolve({ success: false, error: '정제 에러', isProcessing: false, isReady });
            }
          }

          if (type === 'ERROR') {
            worker.removeEventListener('message', onWorkerMessage);
            setIsProcessing(false);
            resolve({ success: false, error: payload, isProcessing: false, isReady });
          }
        };

        worker.addEventListener('message', onWorkerMessage);
        worker.postMessage(
          {
            type: 'PROCESS',
            payload: {
              imageData: imageData.data.buffer,
              width: canvas.width,
              height: canvas.height,
            },
          },
          [imageData.data.buffer],
        );
      });
    },
    [isReady],
  );

  return { recognize, isReady, isProcessing };
};
