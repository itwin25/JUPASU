import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewApi } from '../api/review.api';
import { QUERY_KEY } from '@/constants/query-key';

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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.REVIEW.LIST(variables.wineId) });
    },
  });
}

export function useUpdateReviewMutation() {
  return useMutation({
    mutationFn: ({ id, content }: { id: string | number; content: string }) => reviewApi.update(id, content),
  });
}

export function useDeleteReviewMutation() {
  return useMutation({
    mutationFn: reviewApi.delete,
  });
}
