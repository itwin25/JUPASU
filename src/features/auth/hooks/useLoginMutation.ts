import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';

export function useLoginMutation() {
  return useMutation({
    mutationFn: authApi.login,
  });
}

export function useSignupMutation() {
  return useMutation({
    mutationFn: authApi.signup,
  });
}

export function useLogoutMutation() {
  return useMutation({
    mutationFn: authApi.logout,
  });
}
