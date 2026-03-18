/**
 * 환경 변수 안전하게 읽기
 *
 * 우선순위:
 * 1. NEXT_PUBLIC_API_URL
 * 2. NEXT_PUBLIC_API_BASE_URL
 * 3. /api
 */
const rawApiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  '/api';

const normalizeBaseUrl = (url: string) => url.replace(/\/+$/, '');

export const env = {
  API_BASE_URL: normalizeBaseUrl(rawApiBaseUrl),
  IS_DEV: process.env.NODE_ENV === 'development',
} as const;