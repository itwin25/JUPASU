import { api } from '@/lib/axios';
import { API_PATH } from '@/constants/api-path';
import { UserMyPageResponse } from '@/features/user/types/user.types';
export const userApi = {
  /**
   * 내 마이페이지 프로필 정보 조회
   */
  getMyPageProfile: async (): Promise<UserMyPageResponse> => {
    const { data } = await api.get<{ data: UserMyPageResponse }>(API_PATH.USER.ME);
    return data.data;
  },
};
