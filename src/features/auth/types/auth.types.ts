import { ErrorCode } from './error.types';
import { SigninSchema } from '../schemas/auth.schema';

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

export type SigninRequest = SigninSchema;

// 응답 (공통)
export interface AuthResponse<T = null> {
  headers?: Record<string, string>;
  data: T;
  message: string;
  status: number;
}

// 에러
export interface AuthErrorResponse {
  code: ErrorCode;
  message: string;
}
