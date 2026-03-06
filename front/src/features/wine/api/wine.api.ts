import { api } from '@/lib/axios';
import { API_PATH } from '@/constants/api-path';
import { Wine, WineListParams } from '../types/wine.types';
import { PaginatedResponse } from '@/types/api.types';

export const wineApi = {
  getList: (params?: WineListParams) => 
    api.get<PaginatedResponse<Wine>>(API_PATH.WINE.LIST, { params }).then(res => res.data),
    
  getDetail: (id: string | number) => 
    api.get<Wine>(API_PATH.WINE.DETAIL(id)).then(res => res.data),
    
  getQuickRecommendation: () => 
    api.get<Wine[]>(API_PATH.WINE.RECOMMEND).then(res => res.data),
    
  scrap: (id: string | number) => 
    api.post(`/wines/${id}/scrap`).then(res => res.data),
};
