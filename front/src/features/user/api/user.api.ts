import { api } from '@/lib/axios';
import { API_PATH } from '@/constants/api-path';
import {
  UserInfo,
  UpdateProfileRequest,
  WithdrawRequest,
  UserProfileResponse,
} from '@/types/user.types';

export const userApi = {
  // 프로필 조회
  getUserProfile: async (): Promise<UserInfo> => {
    const response = await api.get<UserProfileResponse>(API_PATH.USER.ME);
    return response.data.data;
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
