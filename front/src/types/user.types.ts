/**
 * 사용자 정보 타입
 */
export interface UserInfo {
  id: number;
  email: string;
  nickname: string;
  profileImageUrl?: string;
}

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
