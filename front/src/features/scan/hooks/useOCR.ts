'use client';

import { useState, useCallback } from 'react';
import { OCRResult } from '../types';

export const useOCR = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeOCR = useCallback(
    async (
      source: File | HTMLCanvasElement,
    ): Promise<{
      success: boolean;
      results: OCRResult[];
      refined?: { winery: string; wineName: string; vintage: string };
      imageInfo?: { width: number; height: number };
    }> => {
      setIsLoading(true);
      setError(null);
      try {
        console.log('📡 [Server OCR] 서버 분석 요청 중...');

        const formData = new FormData();

        if (source instanceof File) {
          // 1. File 객체인 경우 (파일 업로드)
          formData.append('image', source);
        } else {
          // 2. Canvas인 경우 (카메라 캡처)
          const blob = await new Promise<Blob | null>((resolve) =>
            source.toBlob(resolve, 'image/jpeg', 0.9),
          );
          if (!blob) throw new Error('이미지 변환 실패');
          formData.append('image', blob, 'scan.jpg');
        }

        // 서버 API 호출
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
