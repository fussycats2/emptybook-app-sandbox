-- 0023 — chat_rooms.last_message_at 자동 갱신
--
-- 증상: 채팅 목록이 카카오톡처럼 "최신 활동 방 → 위" 로 정렬돼야 하는데, 신규 메시지를
--      보내도 방이 위로 올라오지 않는다.
--
-- 원인: 0001_init 에서 chat_rooms 에 SELECT/INSERT RLS 만 만들고 UPDATE 정책이 없다.
--      RLS 가 켜진 상태에서 정책 없는 UPDATE 는 silent 0-row update (에러 없이 무시).
--      sendMessage repo 함수가 `update({ last_message_at: now() })` 를 호출해도
--      반영되지 않아 컬럼이 계속 NULL 로 남고, listChats 의 `order(last_message_at desc)`
--      가 NULL 그룹과 섞이며 의도와 다른 순서가 나옴.
--
-- 해결:
--  1) chat_rooms 에 UPDATE RLS 정책 추가 (참여자(buyer/seller)만 갱신 가능).
--     클라이언트 sendMessage 폴백 경로가 다시 동작하도록.
--  2) 그것만으로는 다른 클라이언트가 보낸 메시지/엣지 케이스(클라이언트가 두 번째 update 호출 실패)
--     를 못 잡으므로, messages INSERT 트리거를 추가해 서버 측에서 last_message_at 을
--     무조건 자동 갱신. SECURITY DEFINER 로 RLS 우회.
--  3) 기존 행 백필 — 메시지가 있는 방은 max(created_at) 으로, 메시지가 없는 방은
--     room.created_at 으로. 마이그레이션 적용 즉시 정렬이 정상화되도록.

-- ---------- 1) UPDATE RLS ----------
drop policy if exists "chat_rooms_update_party" on public.chat_rooms;
create policy "chat_rooms_update_party" on public.chat_rooms
  for update
  using (auth.uid() = buyer_id or auth.uid() = seller_id)
  with check (auth.uid() = buyer_id or auth.uid() = seller_id);

-- ---------- 2) 메시지 INSERT 트리거 ----------
create or replace function public.bump_chat_room_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.chat_rooms
     set last_message = new.body,
         last_message_at = new.created_at
   where id = new.room_id;
  return new;
end;
$$;

drop trigger if exists trg_bump_chat_room_on_message on public.messages;
create trigger trg_bump_chat_room_on_message
  after insert on public.messages
  for each row
  execute function public.bump_chat_room_on_message();

-- ---------- 3) 기존 데이터 백필 ----------
-- 메시지가 1건 이상 있는 방: 가장 최근 메시지로 last_message_at + last_message 채움
update public.chat_rooms r
   set last_message_at = m.last_at,
       last_message    = coalesce(r.last_message, m.last_body)
  from (
    select distinct on (room_id)
           room_id,
           created_at as last_at,
           body       as last_body
      from public.messages
     order by room_id, created_at desc
  ) m
 where m.room_id = r.id;

-- 메시지가 한 건도 없는 방: room.created_at 으로 채워 정렬 기준을 만든다.
-- (NULL 인 채로 두면 nullsFirst/Last 옵션에 따라 다른 위치로 튐 — 결정성 보장 위해 채움)
update public.chat_rooms
   set last_message_at = created_at
 where last_message_at is null;
