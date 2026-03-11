import { api } from '@/lib/axios';
import { API_PATH } from '@/constants/api-path';
import { LoginRequest, SignupRequest, AuthResponse } from '../types/auth.types';

export const authApi = {
  login: (data: LoginRequest) => 
    api.post<AuthResponse>(API_PATH.AUTH.LOGIN, data).then(res => res.data),
    
  signup: (data: SignupRequest) => 
    api.post<AuthResponse>(API_PATH.AUTH.SIGNUP, data).then(res => res.data),
    
  logout: () => 
    api.post(API_PATH.AUTH.LOGOUT).then(res => res.data),
};
