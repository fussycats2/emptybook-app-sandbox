-- ============================================================
-- 알림 트리거의 사용자 이름 마스킹
-- ------------------------------------------------------------
-- 배경
--   회원가입 시 입력한 실명이 그대로 profiles.display_name 에 저장된다.
--   0006_notification_triggers.sql 의 트리거들은 display_name 을 그대로 payload 에
--   넣어 다른 사용자의 알림 화면(타이틀/본문) 에 실명이 노출됐다.
--
-- 정책
--   첫 글자 + '*' 반복 (TS 의 anonymizeName 과 동일).
--   "김민주" → "김**", "kim" → "k**", "" → fallback
--
-- 적용 범위
--   1. mask_display_name(text) helper 추가
--   2. notify_on_message / notify_on_transaction_insert / notify_on_review 함수 갱신
--   3. 기존 notifications 행의 payload 도 일괄 backfill (kind 별로 title/body 정규식 치환)
-- ============================================================

-- 표시용 이름 마스킹 — 첫 글자만 노출, 나머지는 '*'
create or replace function public.mask_display_name(s text)
returns text
language sql
immutable
as $$
  select case
    when s is null or length(trim(s)) = 0 then null
    when length(trim(s)) <= 1 then trim(s)
    else substring(trim(s), 1, 1) || repeat('*', greatest(1, length(trim(s)) - 1))
  end
$$;


-- 1. 채팅 메시지 알림 — title 을 마스킹된 이름으로
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
  select cr.buyer_id, cr.seller_id, b.title
    into buyer_id, seller_id, book_title
  from public.chat_rooms cr
  left join public.books b on b.id = cr.book_id
  where cr.id = new.room_id;

  if buyer_id is null or seller_id is null then
    return new;
  end if;

  recipient := case
    when new.sender_id = buyer_id then seller_id
    when new.sender_id = seller_id then buyer_id
    else null
  end;

  if recipient is null or recipient = new.sender_id then
    return new;
  end if;

  select coalesce(public.mask_display_name(display_name), '상대방') into sender_name
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


-- 2. 거래 INSERT 알림 — body 의 buyer_name 마스킹
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

  select coalesce(public.mask_display_name(display_name), '구매자') into buyer_name
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


-- 3. 후기 INSERT 알림 — body 의 reviewer_name 마스킹
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

  select coalesce(public.mask_display_name(display_name), '상대방') into reviewer_name
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


-- 기존 알림 행 backfill
-- ------------------------------------------------------------
-- MESSAGE: payload.title 이 sender 의 display_name 이라 가정하고 마스킹
update public.notifications
   set payload = jsonb_set(
     payload,
     '{title}',
     to_jsonb(public.mask_display_name(payload->>'title'))
   )
 where kind = 'MESSAGE'
   and payload ? 'title'
   and payload->>'title' is not null
   and payload->>'title' <> ''
   -- 이미 마스킹된 행(끝에 * 포함) 은 스킵
   and payload->>'title' !~ '\*$';

-- TX_NEW / REVIEW: body 가 "X 님이 ..." 형식 — 첫 단어를 마스킹
-- (정규식 백레퍼런스가 까다로워 함수로 분리)
create or replace function public.__bf_mask_first_word(s text)
returns text
language plpgsql
immutable
as $$
declare
  first_word text;
  rest text;
  m text[];
begin
  if s is null then return s; end if;
  -- 첫 공백 전까지를 first_word, 나머지를 rest 로
  m := regexp_match(s, '^(\S+)(\s.*)?$');
  if m is null then return s; end if;
  first_word := m[1];
  rest := coalesce(m[2], '');
  -- 이미 마스킹돼 있으면(끝에 *) 그대로 반환
  if first_word ~ '\*$' then return s; end if;
  return public.mask_display_name(first_word) || rest;
end;
$$;

update public.notifications
   set payload = jsonb_set(
     payload,
     '{body}',
     to_jsonb(public.__bf_mask_first_word(payload->>'body'))
   )
 where kind in ('TX_NEW', 'REVIEW')
   and payload ? 'body'
   and payload->>'body' is not null
   and payload->>'body' <> '';

drop function public.__bf_mask_first_word(text);
