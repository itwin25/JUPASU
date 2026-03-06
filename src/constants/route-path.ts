/**
 * 프론트엔드 라우트 경로 상수
 */
export const ROUTE_PATH = {
  HOME: '/',
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  ONBOARDING: '/onboarding',
  WINE_SEARCH: '/wine',
  WINE_DETAIL: (id: number | string) => `/wine/${id}`,
  MY_PAGE: '/mypage',
  CHATBOT: '/chatbot',
  REVIEW_WRITE: '/review/new',
  FRIENDS: '/friends',
} as const;
