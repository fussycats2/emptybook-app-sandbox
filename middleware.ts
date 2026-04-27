// Next.js 미들웨어 — 모든 요청이 라우트로 도달하기 전에 한 번 실행된다
// 역할:
//  1) Supabase 세션 토큰을 자동 갱신 (만료된 토큰은 새로 발급)
//  2) 비로그인 사용자가 보호 라우트 접근 시 /login 으로 리다이렉트
//  3) 이미 로그인한 사용자가 /login·/signup 으로 가면 /home 으로 보내기

import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// 로그인이 필요한 경로 prefix 목록
// (홈/검색/도서상세는 게스트 허용 → 여기 들어있지 않음)
const PROTECTED_PREFIXES = [
  "/register",
  "/checkout",
  "/orders",
  "/chat",
  "/mypage",
  "/notifications",
];

// 비로그인 전용 페이지 — 이미 로그인한 사용자가 들어오면 홈으로 보낸다
const AUTH_PAGES = ["/login", "/signup"];

// pathname 이 보호 prefix 와 정확히 같거나 그 하위 경로인지 검사
function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export async function middleware(request: NextRequest) {
  // 토큰 갱신 + 현재 사용자 조회를 한 번에 처리
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Supabase 환경변수가 없으면 mock 모드 — 인증 가드 없이 그대로 통과
  const supabaseConfigured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseConfigured) return response;

  // 비로그인 + 보호 라우트 → 로그인 페이지로 보내고, 원래 가려던 곳을 next 로 보존
  // (로그인 후 next 값으로 다시 돌아갈 수 있게)
  if (!user && isProtected(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 이미 로그인한 사용자가 로그인/회원가입 페이지로 가면 홈으로 회수
  if (user && AUTH_PAGES.includes(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/home";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

// 미들웨어가 동작할 경로 매처
// 정적 파일과 이미지 등은 제외해 불필요한 실행을 막는다
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
