import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wineApi } from '../api/wine.api';
import { QUERY_KEY } from '@/constants/query-key';
import { WineListParams } from '../types/wine.types';

export function useWineListQuery(params?: WineListParams) {
  return useQuery({
    queryKey: QUERY_KEY.WINE.LIST(params),
    queryFn: () => wineApi.searchWines(params),
  });
}

export function useWineDetailQuery(id: string | number) {
  return useQuery({
    queryKey: QUERY_KEY.WINE.DETAIL(id),
    queryFn: () => wineApi.getDetail(id),
    enabled: !!id,
  });
}

export function useWineQuickRecommendQuery() {
  return useQuery({
    queryKey: QUERY_KEY.WINE.RECOMMEND,
    queryFn: wineApi.getQuickRecommendations,
  });
}

export function useWineScrapListQuery() {
  return useQuery({
    queryKey: QUERY_KEY.WINE.SCRAPS,
    queryFn: wineApi.getScraps,
  });
}

export function useWineScrapMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: wineApi.scrap,
    onSuccess: (_, wineId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.WINE.SCRAPS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.WINE.DETAIL(wineId) });
    },
  });
}
