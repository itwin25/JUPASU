/**
 * API 공통 응답 및 요청 타입
 */
export interface ApiResponse<T = unknown> {
  data: T;
  message: string;
  status: number;
}

export interface ApiError {
  message: string;
  status: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
