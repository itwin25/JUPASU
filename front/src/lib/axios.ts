import axios, { InternalAxiosRequestConfig } from 'axios';
import { authToken } from '@/features/auth/utils/auth-token';
import { useAuthStore } from '@/stores/auth.store';

/**
 * 전역 리다이렉트 플래그 (Redirect Storm 방지)
 */
let isRedirecting = false;

/**
 * 공통 Axios 인스턴스 (인증 및 RTR 처리)
 */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
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

    // 401 에러이고 아직 재시도하지 않은 경우
    // 단, 로그인 요청 자체가 401인 경우(계정 정보 불일치 등)는 토큰 재발급 로직을 타지 않음
    const isSigninRequest = originalRequest.url?.includes('/auth/signin');

    if (error.response?.status === 401 && !originalRequest._retry && !isSigninRequest) {
      originalRequest._retry = true;

      try {
        const refreshToken = authToken.getRefresh();
        if (!refreshToken) throw new Error('No refresh token');

        // 토큰 갱신 요청
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh`,
          null,
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          },
        );

        const newAccessToken = response.headers['authorization']?.substring(7);
        const newRefreshToken = response.headers['refresh-token'];

        if (newAccessToken) authToken.setAccess(newAccessToken);
        if (newRefreshToken) authToken.setRefresh(newRefreshToken);

        // 이전 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // 갱신 실패 시 (리프레시 토큰 만료 등) 보안 처리
        if (!isRedirecting) {
          isRedirecting = true;

          // 1. 토큰 및 스토어 정보 삭제
          authToken.remove();
          useAuthStore.getState().clearAuth();

          // 2. 로그인 페이지로 강제 이동 (세션 만료 에러 코드 포함)
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
