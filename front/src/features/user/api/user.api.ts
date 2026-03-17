import { api } from '@/lib/axios';
import { API_PATH } from '@/constants/api-path';

import {
  UserInfo,
  UpdateProfileRequest,
  WithdrawRequest,
  UserProfileResponse,
  UserMyPageResponse
} from '@/types/user.types';

export const userApi = {
  /**
   * 마이페이지 프로필 정보 조회
   */
  getMyPageProfile: async (): Promise<UserMyPageResponse> => {
    const { data } = await api.get<{ data: UserMyPageResponse }>(API_PATH.USER.ME);
    return data.data;
  },

  // 프로필 수정 (닉네임, 이미지 등)
  updateUserProfile: async (data: UpdateProfileRequest): Promise<void> => {
    await api.patch(API_PATH.USER.ME, data);
  },

  // 회원 탈퇴
  withdrawUser: async (data: WithdrawRequest): Promise<void> => {
    await api.post(API_PATH.USER.WITHDRAW, data);
  },
};
