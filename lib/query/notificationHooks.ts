"use client";

// 알림 React Query 훅 + Zustand unread store 동기화
// - useNotifications  : 알림 목록. 결과의 unread 개수를 store 에 반영
// - useMarkNotificationRead / useMarkAllNotificationsRead : optimistic update + store 갱신

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationRow,
} from "@/lib/repo";
import { queryKeys } from "./keys";
import { useNotificationsStore } from "@/lib/store/notificationsStore";

export function useNotifications() {
  const setUnread = useNotificationsStore((s) => s.setUnreadCount);
  const query = useQuery({
    queryKey: queryKeys.notification.list(),
    queryFn: () => listNotifications(),
  });

  // 결과가 갱신될 때마다 store 의 unread 카운트 동기화
  useEffect(() => {
    if (!query.data) return;
    setUnread(query.data.filter((n) => n.unread).length);
  }, [query.data, setUnread]);

  return query;
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  const setUnread = useNotificationsStore((s) => s.setUnreadCount);
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onMutate: async (id) => {
      // optimistic: 캐시에서 해당 항목 unread=false 로 표시
      await qc.cancelQueries({ queryKey: queryKeys.notification.list() });
      const prev = qc.getQueryData<NotificationRow[]>(
        queryKeys.notification.list()
      );
      if (prev) {
        const next = prev.map((n) =>
          n.id === id ? { ...n, unread: false } : n
        );
        qc.setQueryData(queryKeys.notification.list(), next);
        setUnread(next.filter((n) => n.unread).length);
      }
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(queryKeys.notification.list(), ctx.prev);
        setUnread(ctx.prev.filter((n) => n.unread).length);
      }
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  const setUnread = useNotificationsStore((s) => s.setUnreadCount);
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: queryKeys.notification.list() });
      const prev = qc.getQueryData<NotificationRow[]>(
        queryKeys.notification.list()
      );
      if (prev) {
        const next = prev.map((n) => ({ ...n, unread: false }));
        qc.setQueryData(queryKeys.notification.list(), next);
        setUnread(0);
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(queryKeys.notification.list(), ctx.prev);
        setUnread(ctx.prev.filter((n) => n.unread).length);
      }
    },
  });
}
