// 알림 unread 카운트 — Zustand
// ---------------------------------------------------------------
// 왜 store 가 필요한가
//   알림 목록(/notifications) 외에도 향후 BottomTabNav / AppHeader 의 뱃지에서
//   같은 unread 수를 보여줘야 한다. React Query 캐시는 컴포넌트가
//   해당 queryKey 를 사용해야 구독되지만, 뱃지처럼 "어디서나 한 줄로 가져오고 싶은"
//   파생 값은 store 로 두는 편이 깔끔.
//
// 동기화
//   - useNotifications() 가 데이터를 받을 때마다 setUnreadCount 호출
//   - markRead / markAllRead mutation 이 즉시 카운트 갱신 (optimistic)

import { create } from "zustand";

interface NotificationsState {
  unreadCount: number;
  setUnreadCount: (n: number) => void;
  decrement: () => void;
  reset: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (n) => set({ unreadCount: Math.max(0, n) }),
  decrement: () =>
    set((s) => ({ unreadCount: Math.max(0, s.unreadCount - 1) })),
  reset: () => set({ unreadCount: 0 }),
}));
