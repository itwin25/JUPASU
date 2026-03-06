/**
 * API 엔드포인트 경로 상수
 */
export const API_PATH = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    SIGNUP: '/auth/signup',
    ME: '/auth/me',
  },
  WINE: {
    LIST: '/wines',
    DETAIL: (id: number | string) => `/wines/${id}`,
    RECOMMEND: '/wines/recommend',
  },
  USER: {
    PROFILE: '/users/profile',
    ONBOARDING: '/users/onboarding',
  },
  REVIEW: {
    LIST: '/reviews',
    CREATE: '/reviews',
    DETAIL: (id: number | string) => `/reviews/${id}`,
  },
} as const;
