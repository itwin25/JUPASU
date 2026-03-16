import { ErrorCode } from './error.types';

// 요청
export interface SignupRequest {
  email: string;
  nickname: string;
  password: string;
}

export interface SendOtpRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  code: string;
}

export interface ValidateNicknameRequest {
  nickname: string;
}

export interface ValidateEmailRequest {
  email: string;
}

// 응답
export interface AuthResponse<T = null> {
  data: T;
  message: string;
  status: number;
}

// 에러
export interface AuthErrorResponse {
  code: ErrorCode;
  message: string;
}
