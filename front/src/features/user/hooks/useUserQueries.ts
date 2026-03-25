import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEY } from '@/constants/query-key';
import { userApi } from '../api/user.api';
import type {
  UserMyPageResponse,
  UserSearchResponse,
  UpdateProfileRequest,
} from '@/types/user.types';

export function useUserProfile() {
  return useQuery<UserMyPageResponse>({
    queryKey: QUERY_KEY.USER.ME,
    queryFn: userApi.getMyPageProfile,
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation<UserMyPageResponse, Error, UpdateProfileRequest>({
    mutationFn: userApi.updateUserProfile,
    onSuccess: async (updatedProfile) => {
      queryClient.setQueryData(QUERY_KEY.USER.ME, updatedProfile);
      queryClient.setQueryData(QUERY_KEY.USER.PROFILE, updatedProfile);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEY.USER.ME }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEY.USER.PROFILE }),
      ]);
    },
  });
}

export function useWithdrawMutation() {
  return useMutation({
    mutationFn: userApi.withdrawUser,
  });
}

export function useUpdatePreferenceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.updatePreference,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report', 'taste'] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY.USER.ME, 'preferences'] });
    },
  });
}

export function useSearchUsersQuery(nickname: string) {
  return useQuery<UserSearchResponse[]>({
    queryKey: ['users', 'search', nickname],
    queryFn: () => userApi.searchUsers(nickname),
    enabled: nickname.trim().length >= 2,
  });
}

export function usePreferenceQuery() {
  return useQuery({
    queryKey: [QUERY_KEY.USER.ME, 'preferences'],
    queryFn: userApi.getPreference,
  });
}