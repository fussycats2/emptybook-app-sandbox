// Next.js 미들웨어에서 사용할 Supabase 세션 갱신 헬퍼
// - 모든 요청마다 호출되어 만료된 토큰을 자동으로 새로고침한다
// - 현재 로그인 사용자(user)를 함께 반환해, 보호 라우트 가드를 작성하기 쉽게 한다

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// request → response 흐름 안에서 세션을 갱신하고 user 정보를 돌려준다
export async function updateSession(request: NextRequest) {
  // 기본 통과 응답 (이후 쿠키 변경이 있으면 setAll 안에서 새 응답으로 교체)
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Supabase 키가 없으면 mock 모드. 인증을 강제할 수 없으니 그대로 통과시킨다
  if (!url || !key) {
    return { response, user: null as null | { id: string; email?: string } };
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(list: { name: string; value: string; options?: CookieOptions }[]) {
        // 1) 들어오는 request 쿠키에도 반영(이후 핸들러에서 최신 상태 보이도록)
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        // 2) 새 response 객체를 만들어 갱신된 쿠키를 브라우저에 내려보낸다
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // getUser(): 토큰을 검증해 실제 인증된 사용자 정보를 반환
  // (getSession 보다 안전 — 변조된 쿠키는 user=null 로 떨어진다)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
