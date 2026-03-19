/**
 * 환경 변수 안전하게 읽기
 * 모든 AI 요청은 Spring 백엔드를 통해 전달됩니다.
 */
const rawApiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

const normalizeBaseUrl = (url: string) => url.replace(/\/+$/, '');

export const env = {
  // Spring 백엔드 API 기본 주소 (Nginx를 거치거나 직접 접속)
  NEXT_PUBLIC_API_BASE_URL: normalizeBaseUrl(rawApiBaseUrl),
  IS_DEV: process.env.NODE_ENV === 'development',
} as const;
