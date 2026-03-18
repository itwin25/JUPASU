import { API_PATH } from '@/constants/api-path';
import { api } from '@/lib/axios';
import {
  AuthResponse,
  SignupRequest,
  SigninRequest,
  ResetPasswordRequest,
} from '@/features/auth/types/auth.types';
import { AxiosResponse } from 'axios';

/**
 * 인증 관련 API 서비스
 */
export const authApi = {
  /**
   * 이메일 중복 확인
   */
  validateEmail: async (email: string): Promise<AuthResponse<null>> => {
    const { data } = await api.post<AuthResponse<null>>(API_PATH.AUTH.VALIDATE_EMAIL, { email });
    return data;
  },

  /**
   * 닉네임 중복 확인
   */
  validateNickname: async (nickname: string): Promise<AuthResponse<null>> => {
    const { data } = await api.post<AuthResponse<null>>(API_PATH.AUTH.VALIDATE_NICKNAME, {
      nickname,
    });
    return data;
  },

  /**
   * 회원가입 OTP 발송
   */
  sendOtp: async (email: string): Promise<AuthResponse<null>> => {
    const { data } = await api.post<AuthResponse<null>>(API_PATH.AUTH.SEND_OTP, { email });
    return data;
  },

  /**
   * OTP 검증
   */
  verifyOtp: async (email: string, code: string): Promise<AuthResponse<null>> => {
    const { data } = await api.post<AuthResponse<null>>(API_PATH.AUTH.VERIFY_OTP, { email, code });
    return data;
  },

  /**
   * 회원가입 완료
   */
  signUp: async (request: SignupRequest): Promise<AuthResponse<null>> => {
    const { data } = await api.post<AuthResponse<null>>(API_PATH.AUTH.SIGNUP, request);
    return data;
  },

  /**
   * 로그인
   */
  signIn: async (request: SigninRequest): Promise<AxiosResponse<AuthResponse<null>>> => {
    return await api.post<AuthResponse<null>>(API_PATH.AUTH.SIGNIN, request);
  },

  /**
   * 로그아웃
   */
  signOut: async (): Promise<AuthResponse<null>> => {
    const { data } = await api.post<AuthResponse<null>>(API_PATH.AUTH.SIGNOUT);
    return data;
  },

  /**
   * 비밀번호 재설정 OTP 발송
   */
  sendPasswordResetOtp: async (email: string): Promise<AuthResponse<null>> => {
    const { data } = await api.post<AuthResponse<null>>(API_PATH.AUTH.PASS_RESET_SEND, { email });
    return data;
  },

  /**
   * 비밀번호 재설정 OTP 검증
   */
  verifyPasswordResetOtp: async (
    email: string,
    code: string,
  ): Promise<AxiosResponse<AuthResponse<null>>> => {
    return await api.post<AuthResponse<null>>(API_PATH.AUTH.PASS_RESET_VERIFY, { email, code });
  },

  /**
   * 비밀번호 재설정
   */
  resetPassword: async (request: ResetPasswordRequest): Promise<AuthResponse<null>> => {
    const { data } = await api.post<AuthResponse<null>>(API_PATH.AUTH.PASS_RESET, request);
    return data;
  },
};
