// OAuth(PKCE) 콜백 라우트
// - 외부 IdP (Kakao / Naver / Google) 인증을 마친 사용자가 supabase 의 OAuth 흐름을 거쳐
//   ?code=... 쿼리와 함께 이 라우트로 돌아온다.
// - 여기서 code 를 세션으로 교환(exchangeCodeForSession)한 뒤 next 경로로 리다이렉트한다.
// - 실패 시(provider 미설정/취소/만료) 토스트 안내를 위해 /login?error=oauth 로 보낸다.

import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/home";
  // open redirect 방어 — 같은 origin 의 절대경로(`/...`)만 허용
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/home";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=oauth", request.url));
  }

  try {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL("/login?error=oauth", request.url));
    }
  } catch {
    return NextResponse.redirect(new URL("/login?error=oauth", request.url));
  }

  // /home 으로 곧장 보내면 데이터 페치 동안 빈 셸이 보여 체감이 느림.
  // /auth/landing 을 거쳐 BookLoader 로 채운 뒤 user hydrate 가 끝나면 next 로 replace.
  // 예외: /reset-password 는 recovery 세션 흐름이라 곧바로 폼 화면으로 간다.
  const target = safeNext.startsWith("/reset-password")
    ? safeNext
    : `/auth/landing?next=${encodeURIComponent(safeNext)}`;
  return NextResponse.redirect(new URL(target, request.url));
}
