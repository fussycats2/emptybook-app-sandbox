-- ============================================================
-- likes INSERT/DELETE 시 books.like_count 자동 갱신
-- ------------------------------------------------------------
-- 배경
--   기존 toggleLike() 가 클라이언트에서 직접 books.like_count 를 UPDATE 했지만,
--   books_update_own RLS (auth.uid() = seller_id) 때문에 판매자가 아닌 사용자의
--   UPDATE 는 조용히 무시 → likes 행은 들어가는데 카운트만 안 오르는 버그.
--
-- 해결
--   SECURITY DEFINER 트리거로 RLS 를 우회해 books.like_count 를 갱신한다.
--   이로써 클라이언트는 더 이상 books 를 직접 UPDATE 할 필요가 없다.
-- ============================================================

create or replace function public.handle_like_change()
returns trigger
language plpgsql
security definer
as $$
begin
  if tg_op = 'INSERT' then
    update public.books
       set like_count = like_count + 1,
           updated_at = now()
     where id = new.book_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.books
       set like_count = greatest(0, like_count - 1),
           updated_at = now()
     where id = old.book_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists likes_count_sync on public.likes;
create trigger likes_count_sync
after insert or delete on public.likes
for each row execute procedure public.handle_like_change();

-- 마이그레이션 시점 일괄 동기화: 현재 likes 카운트로 books.like_count 재계산
update public.books b
   set like_count = coalesce(c.cnt, 0)
  from (
    select book_id, count(*)::int as cnt
      from public.likes
     group by book_id
  ) c
 where b.id = c.book_id;

-- likes 가 한 건도 없는 책은 0 으로 보정
update public.books
   set like_count = 0
 where id not in (select book_id from public.likes)
   and like_count <> 0;
