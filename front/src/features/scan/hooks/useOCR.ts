'use client';

import { useState, useCallback } from 'react';
import { OCRResult } from '../types';
import { executeOcrAction } from '../actions/ocr.action';

export const useOCR = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeOCR = useCallback(
    async (
      source: File | File[] | HTMLCanvasElement | HTMLCanvasElement[],
      task: 'LABEL_SCAN' | 'MENU_SCAN' = 'LABEL_SCAN'
    ): Promise<{
      success: boolean;
      results: OCRResult[];
      refined?: any;
      imageInfo?: { width: number; height: number };
    }> => {
      setIsLoading(true);
      setError(null);
      try {
        console.group(`📡 [OCR Analysis] ${task} 시작`);
        
        const formData = new FormData();
        formData.append('task', task);

        const sources = Array.isArray(source) ? source : [source];

        for (const s of sources) {
          if (s instanceof File) {
            formData.append('image', s);
          } else if (s instanceof HTMLCanvasElement) {
            const blob = await new Promise<Blob | null>((resolve) =>
              s.toBlob(resolve, 'image/jpeg', 0.9),
            );
            if (!blob) throw new Error('이미지 변환 실패');
            formData.append('image', blob, 'scan.jpg');
          }
        }

        console.log(`입력 소스 처리 완료: ${sources.length}개 이미지`);
        console.log('서버 액션 호출 중...');
        const result = await executeOcrAction(formData);

        if (!result.success) {
          throw new Error(result.error || '분석에 실패했습니다.');
        }

        console.log('✅ 분석 결과 수신 성공');

        if (result.results && result.results.length > 0) {
          console.log('📝 [Raw OCR Text Extraction]');
          console.table(result.results.map(r => ({ text: r.text, score: r.score.toFixed(2) })));
        }
        
        if (result.provider) {
          console.log(`🤖 [AI Provider]: ${result.provider}`);
        }

        if (result.refined) {
          console.log('✨ [AI Refined Recommendation Data]');
          console.log(JSON.stringify(result.refined, null, 2));
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
