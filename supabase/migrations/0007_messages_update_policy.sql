-- ============================================================
-- messages UPDATE RLS 정책 추가
-- ------------------------------------------------------------
-- 배경
--   0001_init.sql 은 messages 에 select / insert 정책만 만들어 두었다.
--   RLS 가 켜진 테이블에서 매칭되는 정책이 없는 명령은 조용히 차단된다.
--   → markRoomMessagesRead() 가 read_at 을 UPDATE 해도 0 행만 영향 →
--     채팅방을 들어가서 읽어도 채팅 목록의 unread 배지가 그대로 남는 버그.
--
-- 정책
--   채팅방 참여자(buyer/seller) 는 해당 방의 messages 를 UPDATE 할 수 있다.
--   ── 컬럼 단위 제한은 RLS 로 표현하기 까다로워, 클라이언트에서는 read_at 만
--      갱신한다는 규약을 신뢰한다 (markRoomMessagesRead 함수 외에는 UPDATE 호출 X).
-- ============================================================

drop policy if exists "messages_update_party" on public.messages;
create policy "messages_update_party" on public.messages
for update
using (
  exists (
    select 1 from public.chat_rooms r
    where r.id = room_id
      and (r.buyer_id = auth.uid() or r.seller_id = auth.uid())
  )
)
with check (
  exists (
    select 1 from public.chat_rooms r
    where r.id = room_id
      and (r.buyer_id = auth.uid() or r.seller_id = auth.uid())
  )
);
