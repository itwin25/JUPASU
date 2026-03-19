/**
 * 환경 변수 안전하게 읽기
 *
 * 우선순위:
 * 1. NEXT_PUBLIC_API_URL
 * 2. NEXT_PUBLIC_API_BASE_URL
 * 3. /api
 */
const rawApiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

const normalizeBaseUrl = (url: string) => url.replace(/\/+$/, '');

export const env = {
  API_BASE_URL: normalizeBaseUrl(rawApiBaseUrl),
  LLM_ENDPOINT: process.env.LLM_ENDPOINT || 'http://70.12.130.111:8000/v1/chat/completions',
  LLM_MODEL: process.env.LLM_MODEL || './qwen3.5-35b-fp8',
  IS_DEV: process.env.NODE_ENV === 'development',
} as const;
