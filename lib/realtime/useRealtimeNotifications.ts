// 내 알림 Realtime 구독 훅 (전역 마운트용)
// - notifications INSERT 이벤트(user_id=eq.<나>) 를 구독해 알림 목록 캐시를 invalidate.
// - 0006_notification_triggers.sql 의 SECURITY DEFINER 트리거가 메시지/거래/후기 이벤트마다
//   notifications 행을 자동 생성하므로, 이 훅 하나만 마운트해도 모든 도메인 알림이 실시간 반영된다.
// - notificationsStore 의 unread 카운트는 useNotifications 가 query.data 를 바탕으로 갱신하므로
//   여기서는 캐시 invalidate 만 호출하면 된다.
//
// 비로그인 / Supabase 미설정 / mock 모드에선 no-op.

"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/AuthProvider";
import { isSupabaseConfigured } from "@/lib/repo";
import { queryKeys } from "@/lib/query/keys";

export function useRealtimeNotifications() {
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
        qc.invalidateQueries({ queryKey: queryKeys.notification.list() });
      };

      const topic = `noti:${uid}:${Math.random().toString(36).slice(2)}`;
      const channel = supabase
        .channel(topic)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${uid}`,
          },
          invalidate
        )
        // 다른 기기/탭에서 read_at 을 업데이트한 경우에도 동기화
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${uid}`,
          },
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
