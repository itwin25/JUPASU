import { useQuery, useMutation } from '@tanstack/react-query';
import { wineApi } from '../api/wine.api';
import { QUERY_KEY } from '@/constants/query-key';
import { WineListParams } from '../types/wine.types';

export function useWineListQuery(params?: WineListParams) {
  return useQuery({
    queryKey: QUERY_KEY.WINE.LIST(params),
    queryFn: () => wineApi.getList(params),
  });
}

export function useWineDetailQuery(id: string | number) {
  return useQuery({
    queryKey: QUERY_KEY.WINE.DETAIL(id),
    queryFn: () => wineApi.getDetail(id),
    enabled: !!id,
  });
}

export function useQuickWineQuery() {
  return useQuery({
    queryKey: QUERY_KEY.WINE.RECOMMEND,
    queryFn: wineApi.getQuickRecommendation,
  });
}

export function useWineScrapMutation() {
  return useMutation({
    mutationFn: wineApi.scrap,
  });
}
