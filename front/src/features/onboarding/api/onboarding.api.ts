import { api } from '@/lib/axios';
import { API_PATH } from '@/constants/api-path';
import { OnboardingRequest } from '../types/onboarding.types';

export const onboardingApi = {
  submit: (data: OnboardingRequest) => 
    api.post(API_PATH.USER.ONBOARDING, data).then(res => res.data),
};
