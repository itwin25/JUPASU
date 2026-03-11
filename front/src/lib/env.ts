/**
 * 환경 변수 안전하게 읽기
 */
export const env = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api',
  IS_DEV: process.env.NODE_ENV === 'development',
} as const;
