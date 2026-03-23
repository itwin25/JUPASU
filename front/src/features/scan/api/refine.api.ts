import { api } from '@/lib/axios';
import { API_PATH } from '@/constants/api-path';
import { RefineTask, RefineResponse } from '../types/refine.types';

export const refineApi = {
  /**
   * 프론트엔드 OCR로 추출한 텍스트를 정제 요청
   * (이미지 파일은 전송하지 않음)
   */
  refine: async (task: RefineTask, textContent: string) => {
    const { data } = await api.post<{ data: RefineResponse }>(API_PATH.AI.REFINE, {
      task,
      textContent,
    });
    return data.data;
  },
};
