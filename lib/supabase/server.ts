// 서버 컴포넌트(RSC) / 서버 액션에서 사용할 Supabase 클라이언트
// - Next.js 의 cookies() 헬퍼를 통해 세션 쿠키를 읽고 쓴다
// - 클라이언트(client.ts)와 달리 사용자별 인증 세션을 서버에서 직접 다룰 수 있다

import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// 호출 시점의 쿠키 컨텍스트를 바탕으로 새 서버 클라이언트를 만든다
export async function supabaseServer() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase 환경변수가 설정되지 않았습니다. .env.local 파일에 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 를 추가하세요."
    );
  }
  return createServerClient(url, key, {
    cookies: {
      // Supabase 가 토큰 갱신을 위해 현재 쿠키 목록을 읽을 때 호출
      getAll() {
        return cookieStore.getAll();
      },
      // Supabase 가 갱신된 토큰을 다시 쿠키에 심으려 할 때 호출
      setAll(
        list: { name: string; value: string; options?: CookieOptions }[]
      ) {
        try {
          list.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // RSC(서버 컴포넌트)에서는 쿠키 쓰기가 막혀있을 수 있음
          // 그 경우 미들웨어(middleware.ts)에서 세션을 새로 갱신해 주므로 무시해도 안전
        }
      },
    },
  });
}
