import { useMutation } from '@tanstack/react-query';
import { onboardingApi } from '../api/onboarding.api';

export function useOnboardingMutation() {
  return useMutation({
    mutationFn: onboardingApi.submit,
  });
}

export function useTasteForm() {
  // 취향 폼 상태 로직 (임시)
  return {};
}
