import { api } from '@/lib/axios';
import { API_PATH } from '@/constants/api-path';
import { ScrapWine, Wine, WineListParams, WineQuickRecommendResponse } from '../types/wine.types';
import { ApiResponse, PaginatedResponse } from '@/types/api.types';

type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
};

export const wineApi = {
  searchWines: (params?: WineListParams) =>
    api
      .get<ApiResponse<PageResponse<Wine>>>(API_PATH.WINE.LIST, { params })
      .then((res) => res.data.data),

  getDetail: (id: string | number) =>
    api.get<ApiResponse<Wine>>(API_PATH.WINE.DETAIL(id)).then((res) => res.data.data),

  getQuickRecommendations: () =>
    api.get<ApiResponse<WineQuickRecommendResponse>>('/wines/quick').then((res) => res.data.data),

  getScraps: (page: number = 0) =>
    api
      .get<ApiResponse<PaginatedResponse<ScrapWine>>>(`${API_PATH.WINE.SCRAPS}?page=${page}`)
      .then((res) => res.data.data),

  /**
   * 사용자가 스크랩한 모든 와인의 ID 목록만 가져옵니다.
   * (현재 백엔드 API 제약으로 0페이지의 데이터에서만 추출하거나, 별도 ID 전용 API가 필요할 수 있습니다.)
   */
  getScrappedIds: () =>
    api
      .get<ApiResponse<PaginatedResponse<ScrapWine>>>(`${API_PATH.WINE.SCRAPS}?size=1000`)
      .then((res) => res.data.data.content.map((item) => item.wineId)),

  scrap: (id: string | number) => api.post(`/wines/${id}/scraps`).then((res) => res.data),
};
