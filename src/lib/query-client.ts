import { QueryClient } from '@tanstack/react-query';

/**
 * 전역 TanStack Query QueryClient 설정
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1분
      gcTime: 1000 * 60 * 60 * 24, // 24시간
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
