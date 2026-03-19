import { useQuery } from '@tanstack/react-query';
import { userApi } from '@/features/user/api/user.api';
export const useUserMyPage = () => {
  return useQuery({
    queryKey: ['user', 'myPage'],
    queryFn: userApi.getMyPageProfile,
    staleTime: 1000 * 60 * 5,
  });
};
