import { useState, useEffect, useRef, useCallback } from 'react';
import { refineApi } from '../api/refine.api';
import { RefineTask } from '../types/refine.types';

export interface OnDeviceOCRResult {
  success: boolean;
  refined?: any;
  error?: string;
  isProcessing: boolean;
  isReady: boolean;
}

export const useOnDeviceOCR = () => {
  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const workerRef = useRef<Worker | null>(null);
useEffect(() => {
  try {
    console.log('🏗️ [Main] OnDevice OCR 워커 생성 시작...');
    // 모듈 워커 대신 클래식 워커 사용 (importScripts 활용)
    // 캐시 무효화를 위해 타임스탬프 쿼리 추가
    const worker = new Worker(`/workers/ocr.worker.js?v=${Date.now()}`);
    workerRef.current = worker;
    console.log('✅ [Main] 워커 객체 생성 성공');
      const handleMessage = (e: MessageEvent) => {
        const { type, payload } = e.data;
        console.log(`📩 [Main] 메시지 수신: type=${type}`, payload);

        if (type === 'INIT_COMPLETE') {
          setIsReady(true);
          console.log('🚀 [Main] OnDevice OCR 서비스 활성화 준비 완료!');
        }
        if (type === 'ERROR') {
          console.error('❌ [Main] 워커 내부 에러:', payload);
        }
        if (type === 'LOG') {
          console.log(`[Worker Log] ${payload}`);
        }
      };

      worker.addEventListener('message', handleMessage);

      const origin = window.location.origin;
      console.log('📤 [Main] 워커 초기화 명령 전송 (INIT)');
      worker.postMessage({
        type: 'INIT',
        payload: {
          // 모바일 모델의 낮은 인식률로 인해 다시 서버용 고정밀 모델로 복구
          detModelUrl: `${origin}/models/server/det_server.onnx`,
          recModelUrl: `${origin}/models/server/rec_latin.onnx`,
          dictUrl: `${origin}/models/dicts/latin_dict.txt`
        }
      });
      return () => {
        console.log('🗑️ [Main] 워커 정리');
        worker.removeEventListener('message', handleMessage);
        worker.terminate();
      };
    } catch (err) {
      console.error('❌ [Main] 워커 초기화 중 에러 발생:', err);
    }
  }, []);

  const recognize = useCallback(async (
    canvas: HTMLCanvasElement, 
    task: RefineTask = 'LABEL_SCAN'
  ): Promise<OnDeviceOCRResult> => {
    const worker = workerRef.current;
    if (!worker || !isReady) {
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
          console.log('⚙️ [Hook] 워커 처리 완료, 텍스트 정제 시작:', payload);
          worker.removeEventListener('message', onWorkerMessage);
          
          try {
            const refinedData = await refineApi.refine(task, payload.text);
            console.log('✅ [Hook] 정제 결과 수신 완료:', refinedData);
            setIsProcessing(false);
            resolve({
              success: true,
              refined: refinedData,
              isProcessing: false,
              isReady
            });
          } catch (err: any) {
            console.error('❌ [Hook] OCR 정제 에러:', err);
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
          worker.removeEventListener('message', onWorkerMessage);
          setIsProcessing(false);
          resolve({
            success: false,
            error: payload,
            isProcessing: false,
            isReady
          });
        }
      };

      worker.addEventListener('message', onWorkerMessage);

      worker.postMessage({
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
