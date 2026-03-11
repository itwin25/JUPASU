/**
 * 프론트엔드 라우트 경로 상수
 */
export const ROUTE_PATH = {
  HOME: '/home',
  LOGIN: '/login',
  SIGNUP: '/signup',
  ONBOARDING: '/onboarding',
  WINE_SEARCH: '/search',
  WINE_DETAIL: (id: number | string) => `/wines/${id}`,
  MY_PAGE: '/mypage',
  CHATBOT: '/chat',
  REVIEW_WRITE: '/review/write',
  FRIENDS: '/mypage/friends',
} as const;
