/**
 * 인증 토큰 관리 유틸리티 (localStorage 기반, 향후 쿠키로 확장 가능)
 */
const TOKEN_KEY = 'jupasu_auth_token';

export const authToken = {
  get: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  set: (token: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
  },
  remove: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
  },
};
