import { api } from '@/lib/axios';
import { API_PATH } from '@/constants/api-path';

import {
  UpdateProfileRequest,
  WithdrawRequest,
  UserMyPageResponse,
  UpdatePreferenceRequest,
  UserSearchResponse,
} from '@/types/user.types';
import { AuthResponse } from '@/features/auth/types/auth.types';

export const userApi = {
  getMyPageProfile: async (): Promise<UserMyPageResponse> => {
    const { data } = await api.get<{ data: UserMyPageResponse }>(API_PATH.USER.ME);
    return data.data;
  },

  updateUserProfile: async (
    payload: UpdateProfileRequest,
  ): Promise<UserMyPageResponse> => {
    await api.patch(API_PATH.USER.ME, payload);

    const { data: refreshed } = await api.get<{ data: UserMyPageResponse }>(API_PATH.USER.ME);
    return refreshed.data;
  },

  withdrawUser: async (data: WithdrawRequest): Promise<AuthResponse<null>> => {
    const { data: responseData } = await api.post<AuthResponse<null>>(API_PATH.USER.WITHDRAW, data);
    return responseData;
  },

  updatePreference: async (data: UpdatePreferenceRequest): Promise<void> => {
    await api.patch(API_PATH.USER.PREFERENCES, data);
  },

  searchUsers: async (nickname: string): Promise<UserSearchResponse[]> => {
    const { data: responseData } = await api.get<{ data: UserSearchResponse[] }>(
      API_PATH.USER.SEARCH,
      {
        params: { nickname },
      },
    );
    return responseData.data;
  },

  getPreference: async (): Promise<UpdatePreferenceRequest> => {
    const { data: responseData } = await api.get<{ data: UpdatePreferenceRequest }>(
      API_PATH.USER.PREFERENCES,
    );
    return responseData.data;
  },
};