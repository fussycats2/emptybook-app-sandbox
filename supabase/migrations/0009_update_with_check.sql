-- ============================================================
-- books / profiles UPDATE 정책에 WITH CHECK 절 추가
-- ------------------------------------------------------------
-- 배경
--   0001_init.sql 의 books_update_own / profiles_update_own 정책은
--   USING 절만 가지고 WITH CHECK 절이 없다.
--
--   USING 은 "어떤 행을 수정 대상으로 볼 수 있는지" 를 결정하고,
--   WITH CHECK 는 "수정 후의 새 값이 정책을 통과하는지" 를 검증한다.
--
--   WITH CHECK 가 없으면 이론적으로 셀러가 자기 책의 seller_id 를
--   다른 사용자로 변경(=양도) 가능. 비슷하게 profiles.id 도(PK 라 흔치 않지만).
--   현재 앱에는 양도 UI 가 없지만 RLS 만 보면 막혀 있지 않으므로 가드 추가.
--
-- 영향
--   - 셀러십 이전 시도가 RLS 단에서 거부 (PostgreSQL 42501)
--   - 일반적인 컬럼 수정(title/price/state/cover_url 등) 은 그대로 통과
--   - 양도 기능을 추후 도입하면 이 정책을 풀거나 SECURITY DEFINER RPC 로 우회
-- ============================================================

drop policy if exists "books_update_own" on public.books;
create policy "books_update_own" on public.books for update
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
