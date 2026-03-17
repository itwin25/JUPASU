import { API_PATH } from '@/constants/api-path';
import { api } from '@/lib/axios';
import { ApiResponse } from '@/types/api.types';
import {
  FriendInviteRequest,
  FriendListItem,
  FriendPendingItem,
  FriendResponseRequest,
} from '../types/friend.types';

export const friendApi = {
  getFriends: () =>
    api.get<ApiResponse<FriendListItem[]>>(API_PATH.FRIEND.LIST).then((res) => res.data.data),

  getPendingFriends: () =>
    api.get<ApiResponse<FriendPendingItem[]>>(API_PATH.FRIEND.PENDING).then((res) => res.data.data),

  inviteFriend: (data: FriendInviteRequest) =>
    api.post(API_PATH.FRIEND.INVITE, data).then((res) => res.data),

  respondFriendRequest: (data: FriendResponseRequest) =>
    api.patch(API_PATH.FRIEND.ACCEPT, data).then((res) => res.data),

  deleteFriend: (requestId: number) =>
    api.delete(API_PATH.FRIEND.DETAIL(requestId)).then((res) => res.data),
};
