"use client";

// 앱 전역에 한 번만 마운트되는 부트스트랩 컴포넌트
// - 로그인된 사용자의 찜 ID 전체를 hydrate (어느 화면에서든 LikeButton 이 정확한 상태로 시작)
// - 로그아웃 시 클라이언트 store / 사용자 스코프 캐시 초기화
//
// providers.tsx 에서 한 번만 렌더링한다 (children 으로 감싸지 않음)

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useLikesStore } from "./likesStore";
import { useNotificationsStore } from "./notificationsStore";
import { useHydrateLikes, likeKeys } from "@/lib/query/likeHooks";
import { useNotifications } from "@/lib/query/notificationHooks";
import { queryKeys } from "@/lib/query/keys";
import { useRealtimeChatList } from "@/lib/realtime/useRealtimeChatList";
import { useRealtimeNotifications } from "@/lib/realtime/useRealtimeNotifications";

export default function AppBootstrap() {
  const { user } = useAuth();
  const resetLikes = useLikesStore((s) => s.reset);
  const resetNotis = useNotificationsStore((s) => s.reset);
  const queryClient = useQueryClient();

  // 로그아웃되면 store / 사용자 스코프 쿼리 모두 정리
  useEffect(() => {
    if (!user) {
      resetLikes();
      resetNotis();
      queryClient.removeQueries({ queryKey: likeKeys.all });
      queryClient.removeQueries({ queryKey: queryKeys.profile.all });
      queryClient.removeQueries({ queryKey: queryKeys.notification.all });
      queryClient.removeQueries({ queryKey: queryKeys.order.all });
      queryClient.removeQueries({ queryKey: queryKeys.chat.all });
      // book 은 게스트도 보는 데이터라 유지
    }
  }, [user, resetLikes, resetNotis, queryClient]);

  // 찜 ID 전역 hydrate
  useHydrateLikes();

  // 알림 목록 hydrate — 결과의 unread 개수가 자동으로 notificationsStore 에 반영됨
  // (홈 헤더 Badge 등 어디서나 store 만 구독하면 끝)
  useNotifications();

  // 채팅 목록 / 알림 Realtime 구독 — 로그인 상태일 때만 활성, 로그아웃 시 자동 cleanup
  useRealtimeChatList();
  useRealtimeNotifications();

  return null;
}
