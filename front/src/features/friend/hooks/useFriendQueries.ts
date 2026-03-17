import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEY } from '@/constants/query-key';
import { friendApi } from '../api/friend.api';

export function useFriendListQuery() {
  return useQuery({
    queryKey: QUERY_KEY.FRIEND.LIST,
    queryFn: friendApi.getFriends,
  });
}

export function usePendingFriendListQuery() {
  return useQuery({
    queryKey: QUERY_KEY.FRIEND.PENDING,
    queryFn: friendApi.getPendingFriends,
  });
}

export function useInviteFriendMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: friendApi.inviteFriend,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.FRIEND.LIST });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.FRIEND.PENDING });
    },
  });
}

export function useRespondFriendRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: friendApi.respondFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.FRIEND.LIST });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.FRIEND.PENDING });
    },
  });
}

export function useDeleteFriendMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: friendApi.deleteFriend,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.FRIEND.LIST });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.FRIEND.PENDING });
    },
  });
}
