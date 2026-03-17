/**
 * TanStack Query 쿼리 키 상수
 */
export const QUERY_KEY = {
  AUTH: {
    ME: ['auth', 'me'],
  },
  WINE: {
    LIST: (params: unknown) => ['wine', 'list', params],
    DETAIL: (id: number | string) => ['wine', 'detail', id],
    RECOMMEND: ['wine', 'recommend'],
    SCRAPS: ['wine', 'scraps'],
  },
  USER: {
    PROFILE: ['user', 'profile'],
    ME: ['user', 'me'],
  },
  FRIEND: {
    LIST: ['friend', 'list'],
    PENDING: ['friend', 'pending'],
  },
  REVIEW: {
    LIST: (wineId?: number | string) => ['review', 'list', wineId],
    MY: ['review', 'my'],
    DETAIL: (id: number | string) => ['review', 'detail', id],
  },
} as const;
