import { useQuery } from '@tanstack/react-query';
import { userApi } from '@/features/user/api/user.api';
import { QUERY_KEY } from '@/constants/query-key';
import type { UserMyPageResponse } from '@/types/user.types';

export const useUserMyPage = () => {
  return useQuery<UserMyPageResponse>({
    queryKey: QUERY_KEY.USER.ME,
    queryFn: userApi.getMyPageProfile,
    staleTime: 1000 * 60 * 5,
  });
};
