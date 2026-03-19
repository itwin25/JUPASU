import { api } from '@/lib/axios';
import { API_PATH } from '@/constants/api-path';
import { ScrapWine, Wine, WineListParams } from '../types/wine.types';
import { ApiResponse, PaginatedResponse } from '@/types/api.types';

export const wineApi = {
  searchWines: (params?: WineListParams) =>
    api
      .get<ApiResponse<PaginatedResponse<Wine>>>(API_PATH.WINE.LIST, { params })
      .then((res) => res.data.data),

  getDetail: (id: string | number) =>
    api.get<ApiResponse<Wine>>(API_PATH.WINE.DETAIL(id)).then((res) => res.data.data),

  getQuickRecommendation: () => api.get<Wine[]>(API_PATH.WINE.RECOMMEND).then((res) => res.data),

  getScraps: () =>
    api.get<ApiResponse<ScrapWine[]>>(API_PATH.WINE.SCRAPS).then((res) => res.data.data),

  scrap: (id: string | number) => api.post(`/wines/${id}/scraps`).then((res) => res.data),
};
