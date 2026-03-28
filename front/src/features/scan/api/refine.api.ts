import { api } from '@/lib/axios';
import { API_PATH } from '@/constants/api-path';
import { RefineTask, RefineResponse } from '../types/refine.types';

export const refineApi = {
  /**
   * 프론트엔드 OCR로 추출한 텍스트를 정제 요청
   * (ocr.action.ts의 callBackendRefine와 동일한 구조 사용)
   */
  refine: async (task: RefineTask, textContent: string) => {
    console.log('📡 [Refine API] 요청 시작:', { task, textContent });
    
    try {
      const response = await api.post<any>(API_PATH.AI.REFINE, {
        task,
        textContent,
      });
      
      console.log('📥 [Refine API] 백엔드 응답 원본:', response.data);
      
      const result = response.data?.data?.data || response.data?.data || null;
      console.log('✨ [Refine API] 정제된 최종 데이터:', result);
      
      return result;
    } catch (error: any) {
      console.error('❌ [Refine API] 요청 실패:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },
};
