import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 1. 오직 비로그인 유저만 진입 가능 (로그인 유저 진입 시 /home으로 강제 이동)
const GUEST_ONLY_ROUTES = ['/', '/initial', '/login', '/signup', '/password-reset'];
const ACCESS_TOKEN_KEY = 'jupasu_access_token';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(ACCESS_TOKEN_KEY)?.value;

  // 정확한 경로 일치 확인 (startsWith 대신 includes 사용으로 '/' 버그 방지)
  const isGuestOnly = GUEST_ONLY_ROUTES.includes(pathname);

  // Case 1: 로그인한 유저가 비로그인 전용 페이지(/login, /signup 등)에 접근
  if (token && isGuestOnly) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Case 2: 로그인하지 않은 유저가 보호된 경로(그 외 모든 경로)에 접근
  // '/' 경로 역시 GUEST_ONLY에 없으므로, 토큰이 없으면 여기서 걸려 /login으로 이동합니다.
  if (!token && !isGuestOnly) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    loginUrl.searchParams.set('error', 'login_required');
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // api, swagger, 정적 리소스 등을 제외한 모든 경로에서 미들웨어 실행
  matcher: [
    '/((?!api|swagger-ui|v3/api-docs|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)',
  ],
};
