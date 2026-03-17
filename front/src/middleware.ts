import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 토큰 없이 접근 가능한 공개 라우트 목록
const publicRoutes = ['/login', '/signup', '/password-reset'];

// 인증 쿠키 이름
const ACCESS_TOKEN_KEY = 'jupasu_access_token';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 현재 요청된 경로가 publicRoute인지 확인
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // 토큰 존재 여부 확인
  const token = request.cookies.get(ACCESS_TOKEN_KEY)?.value;

  // 토큰이 없는 사용자가 공개되지 않은 라우트에 접근하려는 경우 -> 로그인 페이지로 강제 이동
  if (!token && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    loginUrl.searchParams.set('error', 'login_required');
    return NextResponse.redirect(loginUrl);
  }

  // 이미 로그인한 사용자(토큰 보유)가 로그인/회원가입 페이지에 접근하려는 경우 -> 메인 페이지로 강제 이동
  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // 그 외의 경우는 정상적으로 라우팅 통과
  return NextResponse.next();
}

// 미들웨어가 실행될 경로 설정 (정적 리소스, Next.js 설정 등은 미들웨어 통과 제외)
export const config = {
  matcher: [
    /*
     * 다음 경로들로 시작하는 요청은 미들웨어에서 무시
     * - api (API 라우트)
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화 파일)
     * - 모든 확장자를 가진 파일 (예: .png, .jpg, .svg, .ico)
     */
    '/((?!api|_next/static|_next/image|.*\\.[\\w]+$).*)',
  ],
};
