/**
 * 인증 토큰 관리 유틸리티 (Cookie 기반)
 */
const ACCESS_TOKEN_KEY = 'jupasu_access_token';
const REFRESH_TOKEN_KEY = 'jupasu_refresh_token';

// 쿠키 만료일 설정 (7일)
const COOKIE_EXPIRE_DAYS = 7;

export const authToken = {
  /**
   * Access Token 조회
   */
  getAccess: () => {
    if (typeof window === 'undefined') return null;
    return getCookie(ACCESS_TOKEN_KEY);
  },

  /**
   * Access Token 저장
   */
  setAccess: (token: string) => {
    if (typeof window === 'undefined') return;
    setCookie(ACCESS_TOKEN_KEY, token, COOKIE_EXPIRE_DAYS);
  },

  /**
   * Refresh Token 조회
   */
  getRefresh: () => {
    if (typeof window === 'undefined') return null;
    return getCookie(REFRESH_TOKEN_KEY);
  },

  /**
   * Refresh Token 저장
   */
  setRefresh: (token: string) => {
    if (typeof window === 'undefined') return;
    setCookie(REFRESH_TOKEN_KEY, token, COOKIE_EXPIRE_DAYS);
  },

  /**
   * 모든 토큰 삭제 (로그아웃 시)
   */
  remove: () => {
    if (typeof window === 'undefined') return;
    deleteCookie(ACCESS_TOKEN_KEY);
    deleteCookie(REFRESH_TOKEN_KEY);
  },
};

// 쿠키 설정
function setCookie(name: string, value: string, days: number) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);

  const isSecure = window.location.protocol === 'https:';
  let cookieString = `${name}=${encodeURIComponent(value)}; expires=${date.toUTCString()}; path=/; SameSite=Strict`;

  if (isSecure) {
    cookieString += '; Secure';
  }

  document.cookie = cookieString;
}

// 쿠키 가져오기
function getCookie(name: string): string | null {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    const c = ca[i].trim();
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
  }
  return null;
}

// 쿠키 삭제
function deleteCookie(name: string) {
  document.cookie = `${name}=; Max-Age=-99999999; path=/;`;
}
