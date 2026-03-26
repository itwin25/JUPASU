import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewApi } from '../api/review.api';
import { QUERY_KEY } from '@/constants/query-key';
import { DeleteReviewRequest, UpdateReviewRequest } from '../types/review.types';

export function useMyReviewsQuery(page: number = 0) {
  return useQuery({
    queryKey: QUERY_KEY.REVIEW.MY(page),
    queryFn: () => reviewApi.getMyReviews(page),
    placeholderData: (previousData) => previousData,
  });
}

export function useWineReviewsQuery(wineId: string | number) {
  return useQuery({
    queryKey: QUERY_KEY.REVIEW.LIST(wineId),
    queryFn: () => reviewApi.getWineReviews(wineId),
    enabled: !!wineId,
  });
}

export function useCreateReviewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reviewApi.create,
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEY.REVIEW.MY_BASE }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEY.REVIEW.LIST(variables.wineId) }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEY.USER.ME }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEY.USER.PROFILE }),
      ]);
    },
  });
}

export function useUpdateReviewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateReviewRequest) => reviewApi.update(data),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEY.REVIEW.MY_BASE }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEY.REVIEW.LIST(variables.wineId) }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEY.USER.ME }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEY.USER.PROFILE }),
      ]);
    },
  });
}

export function useDeleteReviewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DeleteReviewRequest) => reviewApi.delete(data),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEY.REVIEW.MY_BASE }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEY.REVIEW.LIST(variables.wineId) }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEY.USER.ME }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEY.USER.PROFILE }),
      ]);
    },
  });
}