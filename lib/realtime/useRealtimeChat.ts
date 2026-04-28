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
import { isSupabaseConfigured, isUuid, listMessages, sendMessage, type MessageRowUI } from "@/lib/repo";

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
  // 주의: Supabase 는 같은 topic 의 채널을 캐시·재사용한다 (`client.channel(name)`).
  // React Strict Mode 가 effect 를 두 번 마운트할 때 같은 이름이면 두 번째 마운트가
  // 이미 .subscribe() 된 채널에 .on() 을 호출해서 에러가 난다. → 매 마운트마다 고유한 topic 사용.
  useEffect(() => {
    if (!roomId || !isSupabaseConfigured) return;
    // mock 시드 채팅(c-1 등) 은 Supabase Realtime 구독 의미 없음 — sendMessage 에서 mock 으로 라우팅됨
    if (!isUuid(roomId)) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    (async () => {
      const { supabaseBrowser } = await import("@/lib/supabase/client");
      const supabase = supabaseBrowser();
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      // setup 중간에 cleanup 이 들어왔으면 더 이상 진행하지 않음
      if (!uid || cancelled) return;
      // topic 에 랜덤 suffix 를 붙여 mount 마다 새 채널을 보장
      const topic = `chat:${roomId}:${Math.random().toString(36).slice(2)}`;
      const channel = supabase
        .channel(topic)
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
      // 채널을 만든 직후 이미 cleanup 이 호출됐다면 즉시 정리
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
