// 서비스 역할(service_role) 키를 사용하는 Supabase Admin 클라이언트
// - RLS 를 우회해 auth.users / 모든 테이블에 직접 접근할 수 있는 강력한 키이므로
//   절대로 클라이언트 번들에 노출되면 안 된다 (NEXT_PUBLIC_ 금지).
// - 사용처: 커스텀 OAuth (네이버) 콜백에서 사용자 생성 / 매직링크 발급 등.
//
// 이 모듈은 서버에서만 import 되어야 한다 — Route Handler / Server Action 에서만.

import { createClient } from "@supabase/supabase-js";

let _admin: ReturnType<typeof createClient> | null = null;

// service_role 키로 만든 Supabase 클라이언트를 반환 (싱글턴 캐시)
export function supabaseAdmin() {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase admin 클라이언트 초기화 실패 — NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 필요합니다."
    );
  }
  _admin = createClient(url, serviceKey, {
    // 서버 전용이라 세션을 디스크에 저장할 필요가 없다
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _admin;
}
