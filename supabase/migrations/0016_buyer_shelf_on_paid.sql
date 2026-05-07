-- ============================================================
-- 0016_buyer_shelf_on_paid.sql
-- transactions 가 PAID 로 INSERT 되면 buyer 의 shelf_items 에 OWNED 로 자동 추가
-- ------------------------------------------------------------
-- 배경
--   사용자 기대: 책을 사면 내 책장에 자동으로 들어와야 한다.
--   현재는 buyer 가 별도로 `/mypage/shelf/add` 에서 다시 추가해야 했다.
--
-- 정책
--   - PAID 트랜잭션 INSERT 시점에 books 메타데이터(title/author/publisher/isbn/
--     category/cover_url) 를 그대로 복사해 buyer 의 shelf_items 에 INSERT.
--   - status = 'OWNED' (구매한 책은 일단 "가지고 있음" 으로 시작 — 사용자가
--     이후에 READING / FINISHED 로 옮길 수 있음)
--   - linked_book_id 는 구매한 books.id 로 채워서 책장에서 "구매한 매물 보기"
--     같은 추적이 가능하게 한다.
--   - 0012 의 ISBN partial unique (`shelf_items_user_isbn_unique`) 와 충돌하지
--     않게 ON CONFLICT DO NOTHING. 이미 책장에 있던 책을 사면 추가 INSERT 만
--     스킵 — 사용자가 직접 분류해 둔 status/별점/메모는 보존.
--
-- RLS / 권한
--   buyer 가 자기 shelf_items 에 INSERT 하는 것이라 RLS 자체는 통과 가능하지만,
--   트리거 호출 컨텍스트가 transactions INSERT 의 SECURITY DEFINER 함수 안이
--   되어야 안정적으로 동작한다 (RLS 우회). 0006 의 알림 트리거와 동일 패턴.
-- ============================================================

create or replace function public.add_book_to_buyer_shelf_on_paid()
returns trigger
language plpgsql
security definer
as $$
declare
  b record;
begin
  if new.status <> 'PAID' then
    return new;
  end if;

  select id, title, author, publisher, isbn, category, cover_url
    into b
    from public.books
   where id = new.book_id;

  if not found then
    return new;
  end if;

  -- ISBN partial unique 와 충돌하면 그대로 스킵 — 이미 책장에 있는 책의
  -- 사용자 분류(별점/메모/상태)를 덮어쓰지 않기 위함.
  -- ISBN 이 NULL 인 경우(직접 입력 책장 항목) 는 unique 제외라 항상 INSERT 가능.
  insert into public.shelf_items
    (user_id, title, author, publisher, isbn, category, cover_url,
     status, linked_book_id)
  values
    (new.buyer_id, b.title, b.author, b.publisher, b.isbn, b.category, b.cover_url,
     'OWNED', b.id)
  on conflict (user_id, isbn) where isbn is not null do nothing;

  return new;
end;
$$;

drop trigger if exists transactions_add_buyer_shelf on public.transactions;
create trigger transactions_add_buyer_shelf
after insert on public.transactions
for each row execute procedure public.add_book_to_buyer_shelf_on_paid();

-- 백필은 의도적으로 생략 — 과거 거래 시점에 사용자가 책장에 책을 안 넣은 데에는
-- 이유가 있을 수 있다(이미 처분, 구매 취소 등). 트리거 도입 시점부터 적용.
