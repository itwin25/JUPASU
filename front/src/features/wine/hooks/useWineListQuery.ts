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

export function useWineScrapListQuery(page: number = 0) {
  return useQuery({
    queryKey: QUERY_KEY.WINE.SCRAPS(page),
    queryFn: () => wineApi.getScraps(page),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * 사용자가 스크랩한 와인 ID 목록을 조회하는 훅입니다.
 * 채팅창의 위시리스트 상태 표시를 위해 사용됩니다.
 */
export function useScrappedWineIdsQuery() {
  return useQuery({
    queryKey: [...QUERY_KEY.WINE.SCRAPS_BASE, 'ids'],
    queryFn: wineApi.getScrappedIds,
  });
}

export function useWineScrapMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: wineApi.scrap,
    onSuccess: (_, wineId) => {
      // 스크랩 성공 시 목록과 ID 리스트 모두 갱신
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.WINE.SCRAPS_BASE });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.WINE.DETAIL(wineId) });
    },
  });
}
