'use client';

import { useState, useCallback } from 'react';
import { OCRResult } from '../types';
import { executeOcrAction } from '../actions/ocr.action';

export const useOCR = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeOCR = useCallback(
    async (
      source: File | HTMLCanvasElement,
    ): Promise<{
      success: boolean;
      results: OCRResult[];
      refined?: any;
      imageInfo?: { width: number; height: number };
    }> => {
      setIsLoading(true);
      setError(null);
      try {
        console.group('📡 [OCR Analysis] 시작');
        console.log('데이터 준비 중...');

        const formData = new FormData();

        if (source instanceof File) {
          formData.append('image', source);
          console.log('입력 소스: File (이미지 업로드)');
        } else {
          const blob = await new Promise<Blob | null>((resolve) =>
            source.toBlob(resolve, 'image/jpeg', 0.9),
          );
          if (!blob) throw new Error('이미지 변환 실패');
          formData.append('image', blob, 'scan.jpg');
          console.log('입력 소스: Canvas (카메라 캡처)');
        }

        console.log('서버 액션 호출 중...');
        const result = await executeOcrAction(formData);

        if (!result.success) {
          throw new Error(result.error || '분석에 실패했습니다.');
        }

        console.log('✅ 분석 결과 수신 성공');
        
        if (result.provider) {
          console.log(`🤖 [AI Provider]: ${result.provider}`);
        }

        if (result.refined) {
          console.log('✨ [LLM Refined Data]');
          console.table(result.refined);
        }

        console.groupEnd();

        return {
          success: true,
          results: result.results || [],
          refined: result.refined,
          imageInfo: result.imageInfo,
        };
      } catch (err) {
        console.error('❌ OCR Error:', err);
        console.groupEnd();
        const msg = err instanceof Error ? err.message : '분석에 실패했습니다.';
        setError(msg);
        throw new Error(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { executeOCR, isLoading, error };
};
