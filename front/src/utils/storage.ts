/**
 * 로컬 스토리지 안전 접근 유틸리티 (SSR 대응)
 */
export const storage = {
  get: (key: string) => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  },
  set: (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
  },
  remove: (key: string) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },
  clear: () => {
    if (typeof window === 'undefined') return;
    localStorage.clear();
  },
};
