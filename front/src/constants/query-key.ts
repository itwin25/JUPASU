/**
 * TanStack Query 쿼리 키 상수
 */
export const QUERY_KEY = {
  AUTH: {
    ME: ['auth', 'me'],
  },
  WINE: {
    LIST: (params: unknown) => ['wine', 'list', params] as const,
    DETAIL: (id: number | string) => ['wine', 'detail', id] as const,
    RECOMMEND: ['wine', 'recommend'] as const,
    SCRAPS_BASE: ['wine', 'scraps'] as const,
    SCRAPS: (page: number = 0) => ['wine', 'scraps', page] as const,
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
    LIST: (wineId?: number | string) => ['review', 'list', wineId] as const,
    MY_BASE: ['review', 'my'] as const,
    MY: (page: number = 0) => ['review', 'my', page] as const,
    DETAIL: (id: number | string) => ['review', 'detail', id] as const,
  },
} as const;
