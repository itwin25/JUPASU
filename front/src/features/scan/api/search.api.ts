import { api } from '@/lib/axios';
import { API_PATH } from '@/constants/api-path';
import { HybridSearchResponse } from '../types/search.types';

/**
 * 와인 검색 관련 API 서비스
 */
export const searchApi = {
  /**
   * 고급 검색 (텍스트 기반 하이브리드 검색)
   *
   * @param query 검색어 (와인명, 와이너리 등)
   * @returns 베스트 매칭 와인 및 유사 와인 추천 목록
   */
  searchAdvanced: async (query: string): Promise<HybridSearchResponse> => {
    const { data } = await api.get<{ data: HybridSearchResponse }>(API_PATH.AI.ADVANCED_SEARCH, {
      params: { q: query },
    });
    return data.data; // data 필드 내부의 HybridSearchResponse 반환
  },
};
