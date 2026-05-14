-- 0024 — profiles.region 컬럼 추가
--
-- 증상: /mypage/settings 에서 동네(자치구) 선택 시 PATCH /rest/v1/profiles 가 400 Bad Request,
--      "저장에 실패했어요" 토스트가 뜬다.
--
-- 원인: 클라이언트(updateMyProfile + Profile 타입) 는 profiles.region 컬럼이 있다는 전제로
--      payload 를 보내는데, 0001_init.sql 에서 region 컬럼은 books 테이블에만 추가됐고
--      profiles 에는 없다. PostgREST 가 unknown column 으로 400 반환 → 저장 실패.
--
-- 해결: profiles 에 region text 컬럼을 추가. 기본값 null (사용자가 선택해야 채워짐).
--      RLS 는 0009 의 profiles_update_own (auth.uid() = id) 이 이미 모든 컬럼에 적용되므로
--      별도 정책 추가 불필요.

alter table public.profiles
  add column if not exists region text;
