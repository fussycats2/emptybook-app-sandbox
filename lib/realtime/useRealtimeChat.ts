// 채팅방 메시지 실시간 구독 훅
// - 마운트 시 listMessages 로 초기 로드
// - Supabase Realtime 으로 messages INSERT 이벤트를 구독하여 새 메시지 실시간 반영
// - send(body) 호출 시 sendMessage repo 함수로 INSERT + 로컬 상태 즉시 갱신(낙관적 업데이트 X — INSERT 응답을 그대로 사용)
// - 비로그인/Supabase 미설정 환경에선 Realtime 구독 없이 sendMessage 가 mock 저장소에 push 후 결과만 반환
//
// 중복 처리: send 가 INSERT 후 받은 row 를 즉시 state 에 추가하면, Realtime 으로도 같은 row 가 echo 된다.
// → Realtime 콜백에서 같은 id 가 이미 있으면 무시 (dedupe by id)

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isSupabaseConfigured, listMessages, sendMessage, type MessageRowUI } from "@/lib/repo";

export type UseRealtimeChat = {
  messages: MessageRowUI[];
  loading: boolean;
  send: (body: string) => Promise<MessageRowUI | null>;
};

export function useRealtimeChat(roomId: string | null | undefined): UseRealtimeChat {
  const [messages, setMessages] = useState<MessageRowUI[]>([]);
  const [loading, setLoading] = useState(true);
  // 최신 messages id 집합 — Realtime echo 중복 추가 방지용. ref 로 두어 effect 의존성 회피
  const seenIds = useRef<Set<string>>(new Set());

  // 새 메시지 1건을 state 에 추가 — 이미 본 id 면 skip
  const appendMessage = useCallback((msg: MessageRowUI) => {
    if (seenIds.current.has(msg.id)) return;
    seenIds.current.add(msg.id);
    setMessages((prev) => [...prev, msg]);
  }, []);

  // 초기 메시지 로드
  useEffect(() => {
    if (!roomId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    seenIds.current = new Set();
    listMessages(roomId)
      .then((list) => {
        if (cancelled) return;
        seenIds.current = new Set(list.map((m) => m.id));
        setMessages(list);
      })
      .catch(() => {
        if (cancelled) return;
        setMessages([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  // Realtime 구독 — Supabase 모드 + roomId 있을 때만
  useEffect(() => {
    if (!roomId || !isSupabaseConfigured) return;
    let unsub: (() => void) | undefined;
    (async () => {
      const { supabaseBrowser } = await import("@/lib/supabase/client");
      const supabase = supabaseBrowser();
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;
      const channel = supabase
        .channel(`chat:${roomId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => {
            const m: any = payload.new;
            const t = (m.type ?? "TEXT").toLowerCase();
            appendMessage({
              id: m.id,
              body: m.body ?? "",
              type: t === "system" ? "system" : "text",
              mine: m.sender_id === uid,
              read: !!m.read_at,
              createdAt: m.created_at,
            });
          }
        )
        .subscribe();
      unsub = () => {
        supabase.removeChannel(channel);
      };
    })();
    return () => unsub?.();
  }, [roomId, appendMessage]);

  // 메시지 전송 — INSERT 결과를 즉시 추가 (Realtime echo 는 dedupe 됨)
  const send = useCallback(
    async (body: string): Promise<MessageRowUI | null> => {
      if (!roomId) return null;
      const msg = await sendMessage(roomId, body);
      if (msg) appendMessage(msg);
      return msg;
    },
    [roomId, appendMessage]
  );

  return { messages, loading, send };
}
