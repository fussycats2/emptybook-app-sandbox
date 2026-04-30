// 채팅 목록 Realtime 구독 훅 (전역 마운트용)
// - 내가 buyer 또는 seller 인 chat_rooms 의 UPDATE(=last_message/last_message_at 갱신)와
//   해당 방의 messages INSERT 이벤트를 구독해 listChats 캐시를 자동 invalidate.
// - /chat 페이지가 열려 있지 않아도 동작해야 하므로 AppBootstrap 에서 1회 마운트한다.
//
// 왜 두 채널인가
//   Supabase Realtime 의 postgres_changes filter 는 단일 컬럼 equality 만 지원해
//   `or(buyer_id.eq.x, seller_id.eq.x)` 같은 OR 필터를 못 건다. 두 개의 .on() 으로
//   buyer / seller 각각 구독한다.
//
// 메시지 INSERT 는 chat_rooms 의 last_message_at 트리거가 없는 환경에서도 unread 카운트가
// 즉시 갱신되도록 추가로 구독한다 (sendMessage 가 chat_rooms 도 UPDATE 하긴 하지만,
// 다른 클라이언트가 보낸 메시지에 대해서도 안전하게 동작하도록 INSERT 도 본다).
//
// 비로그인 / Supabase 미설정 / mock 모드에선 no-op (effect 자체가 실행 안 됨).

"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/AuthProvider";
import { isSupabaseConfigured } from "@/lib/repo";
import { queryKeys } from "@/lib/query/keys";

export function useRealtimeChatList() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const uid = user?.id;

  useEffect(() => {
    if (!uid || !isSupabaseConfigured) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const { supabaseBrowser } = await import("@/lib/supabase/client");
      const supabase = supabaseBrowser();
      if (cancelled) return;

      const invalidate = () => {
        qc.invalidateQueries({ queryKey: queryKeys.chat.list() });
      };

      // mount 마다 새 채널 — Strict Mode 안전을 위해 random suffix
      const topic = `chat-list:${uid}:${Math.random().toString(36).slice(2)}`;
      const channel = supabase
        .channel(topic)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "chat_rooms",
            filter: `buyer_id=eq.${uid}`,
          },
          invalidate
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "chat_rooms",
            filter: `seller_id=eq.${uid}`,
          },
          invalidate
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_rooms",
            filter: `buyer_id=eq.${uid}`,
          },
          invalidate
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_rooms",
            filter: `seller_id=eq.${uid}`,
          },
          invalidate
        )
        // messages INSERT 는 sender 가 내가 아닐 때만 의미가 있다 (내가 보낸 건 sendMessage 가 직접 캐시 갱신).
        // 하지만 filter 로 sender_id != uid 를 걸 수 없어 (postgres_changes 는 != 미지원),
        // 일단 받고 invalidate 만 한다. listChats 가 unread 를 다시 계산하므로 over-invalidation 비용은 미미.
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages" },
          invalidate
        )
        .subscribe();

      if (cancelled) {
        supabase.removeChannel(channel);
        return;
      }
      cleanup = () => {
        supabase.removeChannel(channel);
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [uid, qc]);
}
