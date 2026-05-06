-- ============================================================
-- 0014_shelf_books_sync.sql
-- books.status 변경 시 연결된 shelf_items 의 status 자동 전이
-- ------------------------------------------------------------
-- 배경
--   v9 에서 사용자가 책장(/mypage/shelf)의 "판매예정(FOR_SALE)" 책을
--   `/register?shelfId=...` 로 매물 등록하면 `shelf_items.linked_book_id`
--   가 채워진다. 그런데 그 매물이 SOLD / HIDDEN 으로 바뀌면 책장은 여전히
--   FOR_SALE 로 남아 있어, 사용자가 직접 책장에 들어가 OWNED 로 옮겨야 했다.
--
-- 정책
--   책의 status 가 SOLD / HIDDEN (= 더 이상 판매되지 않는 상태) 으로
--   변경되면, linked_book_id 로 연결된 shelf_items 중 status 가 FOR_SALE
--   인 행을 자동으로 OWNED (책은 그대로 가지고 있음 — 정리됨) 로 옮긴다.
--
--   이미 OWNED / READING / FINISHED 인 행은 사용자의 명시적 분류이므로
--   건드리지 않음. linked_book_id 자체는 유지해서 사용자가 책장에서
--   "등록된 매물 보기" 링크로 과거 거래를 추적할 수 있게 한다.
--
-- RLS
--   books_update_own 정책이 판매자 본인만 status 변경을 허용하지만, 책장은
--   다른 사용자(구매자)에게는 보이지 않는 본인 데이터라 RLS 적용 대상 자체가
--   다르다. SECURITY DEFINER 로 우회해 shelf_items.status 갱신을 보장한다.
-- ============================================================

create or replace function public.sync_shelf_on_book_status_change()
returns trigger
language plpgsql
security definer
as $$
begin
  -- status 가 실제로 바뀐 경우만, 그리고 SOLD / HIDDEN 으로 전환된 경우만 동작
  if new.status is distinct from old.status
     and new.status in ('SOLD', 'HIDDEN') then
    update public.shelf_items
       set status = 'OWNED'
     where linked_book_id = new.id
       and status = 'FOR_SALE';
  end if;
  return new;
end;
$$;

drop trigger if exists books_status_sync_shelf on public.books;
create trigger books_status_sync_shelf
after update of status on public.books
for each row execute procedure public.sync_shelf_on_book_status_change();

-- 마이그레이션 시점 백필: 이미 SOLD / HIDDEN 인 매물에 연결된 FOR_SALE
-- 책장 행이 있다면 한 번에 정리. 트리거 도입 전 데이터에 대한 보정.
update public.shelf_items s
   set status = 'OWNED',
       updated_at = now()
  from public.books b
 where s.linked_book_id = b.id
   and s.status = 'FOR_SALE'
   and b.status in ('SOLD', 'HIDDEN');
