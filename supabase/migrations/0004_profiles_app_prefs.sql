-- ============================================================
-- profiles.app_prefs (jsonb) 추가
-- ------------------------------------------------------------
-- 알림(push)/개인정보(privacy) 토글, 마케팅 수신 동의 등 가벼운 사용자 환경설정을
-- 컬럼 분리 없이 하나의 jsonb 로 보관.
--
-- 예시:
--   {
--     "push": { "all": true, "chat": true, "trade": true, "marketing": false },
--     "privacy": { "location": true, "wishlist_public": false, "trades_public": true }
--   }
--
-- 누락된 키는 클라이언트가 기본값으로 처리한다 (DB 단계에서 형상 강제 X)
-- ============================================================

alter table public.profiles
  add column if not exists app_prefs jsonb not null default '{}'::jsonb;
