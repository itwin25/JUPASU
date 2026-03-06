/**
 * 전역 공통 에러 메시지
 */
export const ERROR_MESSAGES = {
  UNKNOWN: '알 수 없는 에러가 발생했습니다. 다시 시도해 주세요.',
  NETWORK: '네트워크 연결 상태를 확인해 주세요.',
  UNAUTHORIZED: '로그인이 필요한 서비스입니다.',
  FORBIDDEN: '접근 권한이 없습니다.',
  NOT_FOUND: '요청하신 페이지를 찾을 수 없습니다.',
  SERVER: '서버 에러가 발생했습니다. 잠시 후 다시 시도해 주세요.',
} as const;
