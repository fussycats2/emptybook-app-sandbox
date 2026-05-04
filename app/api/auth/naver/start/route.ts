// 네이버 OAuth 진입점 ("/api/auth/naver/start")
// - Supabase 가 네이버를 내장 Provider 로 지원하지 않아 직접 구현한다.
// - 흐름: 클라가 이 라우트로 GET → state(=CSRF 토큰) 만들어 쿠키에 저장 →
//   네이버 인증 페이지로 302 → 사용자가 네이버에서 동의 → 네이버가 callback 라우트로 redirect.
// - state 외에 next(원래 가려던 경로)도 함께 쿠키에 저장해 두면 callback 에서 꺼내 쓸 수 있다.

import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "node:crypto";

// 쿠키 키 — 모듈 내에서만 사용
const STATE_COOKIE = "naver_oauth_state";
const NEXT_COOKIE = "naver_oauth_next";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "/home";
  // open redirect 방어 — 절대경로(`/...`)만 허용
  const safeNext =
    next.startsWith("/") && !next.startsWith("//") ? next : "/home";

  const clientId = process.env.NAVER_OAUTH_CLIENT_ID;
  if (!clientId) {
    // 운영자에게 설정 누락을 알리고 사용자는 로그인 화면으로 돌려보낸다
    return NextResponse.redirect(new URL("/login?error=oauth", request.url));
  }

  // CSRF 토큰: 콜백에서 쿠키 값과 비교해 위조 요청을 차단한다
  const state = randomBytes(16).toString("hex");

  const callbackUrl = new URL("/api/auth/naver/callback", request.url);
  // 네이버는 Authorization Code Grant 를 사용 — response_type=code 고정
  const authorizeUrl = new URL("https://nid.naver.com/oauth2.0/authorize");
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", callbackUrl.toString());
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl.toString());
  // 5분이면 인증 흐름에는 충분하고 만료 후 자동 정리됨
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 5,
  };
  response.cookies.set(STATE_COOKIE, state, cookieOptions);
  response.cookies.set(NEXT_COOKIE, safeNext, cookieOptions);
  return response;
}
