import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEY } from '@/constants/query-key';
import { userApi } from '../api/user.api';

export function useUserProfile() {
  return useQuery({
    queryKey: QUERY_KEY.USER.ME,
    queryFn: userApi.getUserProfile,
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.updateUserProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.USER.ME });
    },
  });
}

export function useWithdrawMutation() {
  return useMutation({
    mutationFn: userApi.withdrawUser,
  });
}
