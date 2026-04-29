// 찜(좋아요) 전역 상태 — Zustand
// ---------------------------------------------------------------
// 왜 전역인가
//   같은 책이 여러 화면에 동시에 떠 있을 수 있다 (예: 홈 카드 + 도서 상세 푸터 LikeButton).
//   하나에서 토글하면 다른 곳도 즉시 같은 상태를 보여줘야 한다.
//   - liked  : 내가 찜한 책 ID 들의 Set (O(1) lookup)
//   - counts : bookId → like_count 맵. 도서 상세에서 카운트를 즉시 갱신하는 용도
//
// React Query 와의 역할 분담
//   - React Query  : 서버 데이터(리스트, 단건 fetch) 캐싱·invalidation
//   - Zustand store : 토글 후 다른 화면에 즉시 전파해야 할 "파생된 단일 진실 원천"
//   둘은 mutation onSuccess 콜백으로 동기화한다.

import { create } from "zustand";

interface LikesState {
  // 내가 찜한 책 ID 모음. 비로그인 / 미초기화 상태도 빈 Set 으로 일관 처리
  liked: Set<string>;
  // bookId → 최신 like_count. 카드/상세에서 카운터 즉시 반영
  counts: Record<string, number>;

  // 액션
  hydrate: (params: { likedIds?: Iterable<string>; counts?: Record<string, number> }) => void;
  setLiked: (bookId: string, liked: boolean) => void;
  setCount: (bookId: string, count: number) => void;
  // 전체 초기화 (로그아웃 시 호출)
  reset: () => void;
}

export const useLikesStore = create<LikesState>((set) => ({
  liked: new Set<string>(),
  counts: {},

  hydrate: ({ likedIds, counts }) =>
    set((s) => ({
      liked: likedIds ? new Set(likedIds) : s.liked,
      counts: counts ? { ...s.counts, ...counts } : s.counts,
    })),

  setLiked: (bookId, liked) =>
    set((s) => {
      const next = new Set(s.liked);
      if (liked) next.add(bookId);
      else next.delete(bookId);
      return { liked: next };
    }),

  setCount: (bookId, count) =>
    set((s) => ({ counts: { ...s.counts, [bookId]: count } })),

  reset: () => set({ liked: new Set<string>(), counts: {} }),
}));

// 셀렉터 헬퍼 — 컴포넌트는 특정 책의 liked / count 만 구독해 불필요한 리렌더 회피
export const selectIsLiked = (bookId: string) => (s: LikesState) =>
  s.liked.has(bookId);

export const selectLikeCount = (bookId: string) => (s: LikesState) =>
  s.counts[bookId];
