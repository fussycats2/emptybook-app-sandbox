// 조회수 전역 상태 — Zustand (likesStore 와 동일 패턴)
// ---------------------------------------------------------------
// 왜 전역인가
//   도서 상세 진입 시 +1 한 후, 같은 화면이 닫혔다가 다시 열려도(또는 다른 카드에서도)
//   즉시 최신 카운트가 보여야 함. 서버 round-trip 기다리지 않고 낙관적 업데이트로 반영.
//
//   - counts : bookId → 최신 view_count. fetchBook 결과로 시드, increment 시 +1.
//
// React Query 와의 역할 분담
//   - React Query  : 서버 데이터(상세 fetch)를 가져올 때 시드만 채움 (덮어쓰지 않음)
//   - Zustand store : 진입 액션의 즉시 반영(낙관적 업데이트) + 컴포넌트 구독

import { create } from "zustand";

interface ViewsState {
  counts: Record<string, number>;

  // 서버에서 가져온 값으로 시드. store 값과 비교해 더 큰 값을 유지 — 낙관적 +1 후 refetch 가
  // 한 박자 늦게 들어와도 카운트가 뒤로 가지 않게.
  seed: (bookId: string, count: number) => void;
  // 즉시 +1 — 도서 상세 진입 시. 동일 세션 안에서 이미 +1 했다면 호출자가 가드.
  increment: (bookId: string) => void;
  // 강제 셋 (관리자/admin 도구 등에서 필요할 때)
  setCount: (bookId: string, count: number) => void;
  reset: () => void;
}

export const useViewsStore = create<ViewsState>((set) => ({
  counts: {},

  seed: (bookId, count) =>
    set((s) => {
      const current = s.counts[bookId];
      const next = current == null ? count : Math.max(current, count);
      if (next === current) return s;
      return { counts: { ...s.counts, [bookId]: next } };
    }),

  increment: (bookId) =>
    set((s) => ({
      counts: { ...s.counts, [bookId]: (s.counts[bookId] ?? 0) + 1 },
    })),

  setCount: (bookId, count) =>
    set((s) => ({ counts: { ...s.counts, [bookId]: count } })),

  reset: () => set({ counts: {} }),
}));

// 셀렉터 — 특정 책의 viewCount 만 구독해 다른 책 변경에 의한 리렌더 회피
export const selectViewCount = (bookId: string) => (s: ViewsState) =>
  s.counts[bookId];
