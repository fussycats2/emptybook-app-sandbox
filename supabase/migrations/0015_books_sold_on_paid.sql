-- ============================================================
-- 0015_books_sold_on_paid.sql
-- transactions 가 PAID 로 INSERT 되면 연결된 books.status 를 SOLD 로 자동 전이
-- ------------------------------------------------------------
-- 배경
--   현재 흐름:
--     /checkout/[id] → useCreateOrder → repo.createOrder
--       ① transactions INSERT (status='PAID', buyer=me)
--       ② books UPDATE status='SOLD'
--
--   문제: ② 의 books UPDATE 는 buyer 가 seller 의 책을 수정하는 셈인데,
--   `books_update_own` (0009) 정책이 `auth.uid() = seller_id` 만 허용하므로
--   RLS 가 silent 하게 0행 영향을 만든다 → 결제 성공해도 책이 SELLING 으로 남고
--   홈/검색/마이페이지 판매내역에서 그대로 노출됨.
--
-- 정책
--   PAID 트랜잭션이 INSERT 되면 SECURITY DEFINER 트리거가 books.status 를
--   SOLD 로 옮긴다. 이미 SOLD/HIDDEN 인 책에는 영향을 주지 않아 idempotent.
--   취소(CANCELED) 환불 흐름이 도입되면 그 시점에 SELLING 으로 되돌리는 별도
--   분기를 같이 추가하면 된다 (현재는 0010 FSM 이 CANCELED 직행을 차단).
--
-- 사이드 이펙트
--   - 0014 의 `books_status_sync_shelf` 트리거가 books.status 변경을 받아
--     판매자의 shelf_items FOR_SALE → OWNED 로 정리해 준다 (자동 연쇄).
--   - clients 의 useCreateOrder 가 이미 book lists/detail 을 invalidate 하므로
--     화면 동기화는 추가 코드 변경 없이 그대로 동작.
-- ============================================================

create or replace function public.sync_book_status_on_transaction_paid()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.status = 'PAID' then
    update public.books
       set status = 'SOLD'
     where id = new.book_id
       and status not in ('SOLD', 'HIDDEN');
  end if;
  return new;
end;
$$;

drop trigger if exists transactions_sync_book_paid on public.transactions;
create trigger transactions_sync_book_paid
after insert on public.transactions
for each row execute procedure public.sync_book_status_on_transaction_paid();

-- 백필 — 이미 PAID 이상으로 진행된 트랜잭션이 있는데 책이 아직 SELLING/RESERVED
-- 인 케이스(이전 버그로 남은 데이터) 를 한 번에 정리.
update public.books b
   set status = 'SOLD'
  from public.transactions t
 where t.book_id = b.id
   and t.status in ('PAID', 'SHIPPING', 'COMPLETED')
   and b.status not in ('SOLD', 'HIDDEN');
