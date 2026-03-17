export type FriendResponseStatus = 'ACCEPTED' | 'REJECTED';

export interface FriendListItem {
  requestId: number;
  friendId: number;
  nickname: string;
  character: string;
  friendSince: string;
}

export interface FriendPendingItem {
  requestId: number;
  requesterId: number;
  nickname: string;
  character: string;
  createdAt: string;
}

export interface FriendInviteRequest {
  receiverId: number;
  receiverNickname?: string;
}

export interface FriendResponseRequest {
  requestId: number;
  status: FriendResponseStatus;
}
