// 최근 검색어 — Zustand store + localStorage persist
// ---------------------------------------------------------------
// 정책
//   - 게스트/로그인 모두 같은 브라우저에서 동작 (서버 동기화 X)
//   - 검색어 문자열 배열을 최신순으로 보관, max MAX_TERMS 개
//   - 같은 검색어가 다시 오면 맨 앞으로 이동(중복 제거)
//
// SSR 안전성
//   persist 미들웨어가 createJSONStorage(() => localStorage) 를 사용 — 서버에서는
//   in-memory 더미로 떨어져 hydration mismatch 없음. 첫 프레임은 빈 배열이 보일 수 있다.

"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const MAX_TERMS = 8;

interface RecentSearchState {
  terms: string[];
  push: (term: string) => void;
  remove: (term: string) => void;
  clear: () => void;
}

export const useRecentSearchStore = create<RecentSearchState>()(
  persist(
    (set) => ({
      terms: [],

      // 같은 검색어 재검색 시 맨 앞으로 이동, 신규면 prepend, MAX 초과분은 truncate
      push: (term) => {
        const t = term.trim();
        if (!t) return;
        set((s) => {
          const filtered = s.terms.filter((x) => x !== t);
          return { terms: [t, ...filtered].slice(0, MAX_TERMS) };
        });
      },

      remove: (term) =>
        set((s) => ({ terms: s.terms.filter((x) => x !== term) })),

      clear: () => set({ terms: [] }),
    }),
    {
      name: "emptybook:recent-search",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
