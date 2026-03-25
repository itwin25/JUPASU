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
    api.get<ApiResponse<PageResponse<Wine>>>(API_PATH.WINE.LIST, { params }).then((res) => res.data.data),

  getDetail: (id: string | number) =>
    api.get<ApiResponse<Wine>>(API_PATH.WINE.DETAIL(id)).then((res) => res.data.data),

  getQuickRecommendations: () =>
    api.get<ApiResponse<WineQuickRecommendResponse>>('/wines/quick').then((res) => res.data.data),

  getScraps: (page: number = 0) =>
  api
    .get<ApiResponse<PaginatedResponse<ScrapWine>>>(`${API_PATH.WINE.SCRAPS}?page=${page}`)
    .then((res) => res.data.data),

  scrap: (id: string | number) => api.post(`/wines/${id}/scraps`).then((res) => res.data),
};
