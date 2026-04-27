"use client";

// 브라우저(클라이언트 컴포넌트)에서 사용할 Supabase 클라이언트
// - 'use client' 지시어가 있어야 React Client Component에서 import 가능
// - 환경변수가 없으면 명시적으로 에러를 던져 설정 누락을 빠르게 알린다

import { createBrowserClient } from "@supabase/ssr";

// 싱글턴 캐시: 페이지 이동/리렌더 시 매번 새 클라이언트를 만들지 않도록 보관
let _client: ReturnType<typeof createBrowserClient> | null = null;

// 브라우저용 Supabase 클라이언트를 반환한다 (이미 만들어져 있으면 재사용)
export function supabaseBrowser() {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase 환경변수가 설정되지 않았습니다. .env.local 파일에 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 를 추가하세요."
    );
  }
  _client = createBrowserClient(url, key);
  return _client;
}
