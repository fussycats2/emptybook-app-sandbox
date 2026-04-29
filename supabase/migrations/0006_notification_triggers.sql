-- ============================================================
-- 자동 알림 생성 트리거 (messages / transactions / reviews)
-- ------------------------------------------------------------
-- 배경
--   notifications 테이블은 RLS (auth.uid = user_id) 로 잠겨 있고,
--   기존엔 INSERT 하는 코드 자체가 없어서 알림이 한 건도 안 쌓임.
--   각 도메인 이벤트가 일어날 때 SECURITY DEFINER 트리거로 알림 행을
--   자동 생성한다 (RLS 우회 + 누락 0%).
--
-- 알림 종류 ↔ 화면 매핑(repo.ts listNotifications)
--   MESSAGE                 → 'chat'    (채팅 새 메시지)
--   TX_NEW / TX_COMPLETED   → 'trade'   (거래 시작 / 완료)
--   REVIEW                  → 'trade'   (후기 받음)
--   PRICE_DROP / INFO       → 'system'  (트리거 없음 - 운영자용)
--
-- payload 규약
--   { title, body, ...domain_ids }
--   화면이 payload.title / payload.body 만 알면 그릴 수 있게 한다.
-- ============================================================

-- ---------------------------------------------------------------
-- 1. 채팅 메시지 INSERT → 상대방에게 알림
-- ---------------------------------------------------------------
create or replace function public.notify_on_message()
returns trigger
language plpgsql
security definer
as $$
declare
  buyer_id uuid;
  seller_id uuid;
  book_title text;
  recipient uuid;
  sender_name text;
begin
  -- 채팅방 → buyer/seller + 책 제목
  select cr.buyer_id, cr.seller_id, b.title
    into buyer_id, seller_id, book_title
  from public.chat_rooms cr
  left join public.books b on b.id = cr.book_id
  where cr.id = new.room_id;

  if buyer_id is null or seller_id is null then
    return new;
  end if;

  -- 받는 사람 = sender 가 아닌 쪽
  recipient := case
    when new.sender_id = buyer_id then seller_id
    when new.sender_id = seller_id then buyer_id
    else null
  end;

  -- sender 가 방 당사자가 아니거나 본인이 본인에게 보낸 경우엔 skip
  if recipient is null or recipient = new.sender_id then
    return new;
  end if;

  select coalesce(display_name, '상대방') into sender_name
  from public.profiles where id = new.sender_id;

  insert into public.notifications (user_id, kind, payload)
  values (
    recipient,
    'MESSAGE',
    jsonb_build_object(
      'title', sender_name,
      'body', coalesce(new.body, ''),
      'room_id', new.room_id,
      'book_title', coalesce(book_title, '')
    )
  );
  return new;
end;
$$;

drop trigger if exists messages_notify on public.messages;
create trigger messages_notify
after insert on public.messages
for each row execute procedure public.notify_on_message();


-- ---------------------------------------------------------------
-- 2. 거래(transactions) INSERT → 판매자에게 "새 거래" 알림
-- ---------------------------------------------------------------
-- 현재 createOrder 가 status='PAID' 로 바로 INSERT 하므로
-- INSERT 시점에 판매자에게 알림이 가면 된다.
create or replace function public.notify_on_transaction_insert()
returns trigger
language plpgsql
security definer
as $$
declare
  buyer_name text;
  book_title text;
begin
  if new.seller_id = new.buyer_id then
    return new;
  end if;

  select coalesce(display_name, '구매자') into buyer_name
  from public.profiles where id = new.buyer_id;

  select title into book_title
  from public.books where id = new.book_id;

  insert into public.notifications (user_id, kind, payload)
  values (
    new.seller_id,
    'TX_NEW',
    jsonb_build_object(
      'title', '새 거래가 시작됐어요',
      'body', format('%s 님이 ''%s''을(를) 구매했어요',
                     buyer_name, coalesce(book_title, '도서')),
      'transaction_id', new.id,
      'book_id', new.book_id
    )
  );
  return new;
end;
$$;

drop trigger if exists transactions_notify_insert on public.transactions;
create trigger transactions_notify_insert
after insert on public.transactions
for each row execute procedure public.notify_on_transaction_insert();


-- ---------------------------------------------------------------
-- 3. 거래 status → COMPLETED 전이 → 양쪽에 "거래완료" 알림
-- ---------------------------------------------------------------
create or replace function public.notify_on_transaction_complete()
returns trigger
language plpgsql
security definer
as $$
declare
  book_title text;
begin
  if new.status = 'COMPLETED'
     and old.status is distinct from 'COMPLETED' then

    select title into book_title
    from public.books where id = new.book_id;

    -- 구매자: 후기 작성 유도
    insert into public.notifications (user_id, kind, payload)
    values (
      new.buyer_id,
      'TX_COMPLETED',
      jsonb_build_object(
        'title', '거래가 확정됐어요',
        'body', format('''%s'' 거래가 완료됐어요. 후기를 남겨보세요!',
                       coalesce(book_title, '도서')),
        'transaction_id', new.id,
        'book_id', new.book_id
      )
    );

    -- 판매자 (자기자신 거래가 아닐 때만)
    if new.seller_id <> new.buyer_id then
      insert into public.notifications (user_id, kind, payload)
      values (
        new.seller_id,
        'TX_COMPLETED',
        jsonb_build_object(
          'title', '거래가 마무리됐어요',
          'body', format('''%s'' 거래가 완료됐어요',
                         coalesce(book_title, '도서')),
          'transaction_id', new.id,
          'book_id', new.book_id
        )
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists transactions_notify_complete on public.transactions;
create trigger transactions_notify_complete
after update on public.transactions
for each row execute procedure public.notify_on_transaction_complete();


-- ---------------------------------------------------------------
-- 4. 후기(reviews) INSERT → reviewee 에게 알림
-- ---------------------------------------------------------------
create or replace function public.notify_on_review()
returns trigger
language plpgsql
security definer
as $$
declare
  reviewer_name text;
  book_title text;
begin
  if new.reviewee_id = new.reviewer_id then
    return new;
  end if;

  select coalesce(display_name, '상대방') into reviewer_name
  from public.profiles where id = new.reviewer_id;

  select b.title into book_title
  from public.transactions t
  left join public.books b on b.id = t.book_id
  where t.id = new.transaction_id;

  insert into public.notifications (user_id, kind, payload)
  values (
    new.reviewee_id,
    'REVIEW',
    jsonb_build_object(
      'title', '새 후기가 도착했어요',
      'body', format('%s 님이 ★%s 후기를 남겼어요',
                     reviewer_name, new.rating),
      'review_id', new.id,
      'transaction_id', new.transaction_id,
      'book_title', coalesce(book_title, '')
    )
  );
  return new;
end;
$$;

drop trigger if exists reviews_notify on public.reviews;
create trigger reviews_notify
after insert on public.reviews
for each row execute procedure public.notify_on_review();
