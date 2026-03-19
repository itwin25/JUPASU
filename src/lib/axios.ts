import axios, { InternalAxiosRequestConfig } from 'axios';
import { authToken } from '@/features/auth/utils/auth-token';
import { useAuthStore } from '@/stores/auth.store';
import { env } from '@/lib/env';
import { API_PATH } from '@/constants/api-path';

/**
 * 전역 리다이렉트 플래그 (Redirect Storm 방지)
 */
let isRedirecting = false;

/**
 * 공통 Axios 인스턴스 (인증 및 RTR 처리)
 */
export const api = axios.create({
  baseURL: env.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// 요청 인터셉터: 토큰 자동 추가
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = authToken.getAccess();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 응답 인터셉터: 헤더 토큰 추출 및 401 에러 시 토큰 재발급 로직
api.interceptors.response.use(
  (response) => {
    const authHeader = response.headers['authorization'];
    const refreshHeader = response.headers['refresh-token'];

    if (authHeader && authHeader.startsWith('Bearer ')) {
      authToken.setAccess(authHeader.substring(7));
    }

    if (refreshHeader) {
      authToken.setRefresh(refreshHeader);
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    const isSigninRequest = originalRequest.url?.includes(API_PATH.AUTH.SIGNIN);

    if (error.response?.status === 401 && !originalRequest._retry && !isSigninRequest) {
      originalRequest._retry = true;

      try {
        const refreshToken = authToken.getRefresh();
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post(`${env.API_BASE_URL}${API_PATH.AUTH.REFRESH}`, null, {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        });

        const newAccessToken = response.headers['authorization']?.substring(7);
        const newRefreshToken = response.headers['refresh-token'];

        if (newAccessToken) authToken.setAccess(newAccessToken);
        if (newRefreshToken) authToken.setRefresh(newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        if (!isRedirecting) {
          isRedirecting = true;

          authToken.remove();
          useAuthStore.getState().clearAuth();

          if (typeof window !== 'undefined') {
            window.location.href = '/login?error=session_expired';
          }
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
