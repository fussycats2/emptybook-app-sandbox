-- 0022 — 도서 조회수 증가 RPC
--
-- books.view_count 는 0001 에서 정의됐지만 사용처가 없어 0 으로 머물러 있던 컬럼.
-- 도서 상세 진입 시 +1 하려는데 0009 의 books UPDATE RLS 가 본인 매물에만 허용 → 다른 사용자가
-- 들어와도 카운트가 안 늘어남. SECURITY DEFINER RPC 로 RLS 우회해서 +1.
--
-- 본인 매물 진입은 카운트에서 제외 — 작성자가 자기 글 들락거리는 횟수는 의미 없음.

create or replace function public.increment_book_view(p_book_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller uuid;
begin
  select seller_id into v_seller from public.books where id = p_book_id;
  -- 책이 없거나 본인 매물이면 noop
  if v_seller is null then return; end if;
  if v_seller = auth.uid() then return; end if;
  update public.books set view_count = coalesce(view_count, 0) + 1 where id = p_book_id;
end;
$$;

revoke all on function public.increment_book_view(uuid) from public;
grant execute on function public.increment_book_view(uuid) to authenticated, anon;
