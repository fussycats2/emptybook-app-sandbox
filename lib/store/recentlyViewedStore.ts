// 최근 본 상품 — Zustand store + localStorage persist
// ---------------------------------------------------------------
// 정책
//   - 게스트/로그인 모두 같은 브라우저에서 동작 (서버 동기화 X)
//   - bookId 배열을 최신순으로 보관, max MAX_ITEMS 개
//   - 같은 책을 다시 보면 맨 앞으로 이동 (move-to-front, 중복 제거)
//   - 시청 시간(viewedAt) 도 함께 저장해 향후 "오늘 본" 같은 그룹화에 활용 가능
//
// SSR 안전성
//   persist 미들웨어가 createJSONStorage(() => localStorage) 를 사용 — 서버에서는
//   in-memory 더미로 떨어져 hydration mismatch 없음. 페이지가 클라이언트로 마운트된
//   직후에야 실제 데이터가 들어오므로, 처음 한 프레임은 빈 배열이 보일 수 있다.

"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const MAX_ITEMS = 30;

export type RecentItem = {
  bookId: string;
  viewedAt: number; // epoch ms
};

interface RecentlyViewedState {
  items: RecentItem[];
  push: (bookId: string) => void;
  remove: (bookId: string) => void;
  clear: () => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      items: [],

      // 같은 책을 다시 보면 맨 앞으로 이동, 신규면 prepend, MAX 초과분은 truncate
      push: (bookId) =>
        set((s) => {
          const filtered = s.items.filter((it) => it.bookId !== bookId);
          const next: RecentItem[] = [
            { bookId, viewedAt: Date.now() },
            ...filtered,
          ].slice(0, MAX_ITEMS);
          return { items: next };
        }),

      remove: (bookId) =>
        set((s) => ({ items: s.items.filter((it) => it.bookId !== bookId) })),

      clear: () => set({ items: [] }),
    }),
    {
      name: "emptybook:recently-viewed",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);

// 셀렉터: 책 ID 배열만 필요할 때 (참조 안정성을 위해 컴포넌트에서 useMemo 와 함께 사용 권장)
export const selectRecentBookIds = (s: RecentlyViewedState): string[] =>
  s.items.map((it) => it.bookId);
