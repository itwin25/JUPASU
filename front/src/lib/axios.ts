import axios from 'axios';
import { env } from './env';
import { authToken } from './auth-token';

/**
 * 공통 Axios 인스턴스
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
  (config) => {
    const token = authToken.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 응답 인터셉터: 에러 처리 초기 뼈대
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 향후 토큰 재발급(Refresh) 또는 전역 에러 처리를 위한 자리
    return Promise.reject(error);
  },
);
