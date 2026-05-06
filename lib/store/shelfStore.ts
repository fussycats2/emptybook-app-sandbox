// 책장(shelf) 카운트 전역 상태 — Zustand
// 마이페이지 STATS 카드 / 홈 바로가기 카드에서 같은 카운트를 즉시 반영하기 위함.
// 실제 책장 데이터는 React Query 가 캐싱하고, 카운트만 별도로 store 에 동기화한다.

import { create } from "zustand";
import type { ShelfStatus } from "@/lib/supabase/types";

interface ShelfState {
  // 전체 권수 (4가지 status 합계)
  total: number;
  // 상태별 카운트 — 마이페이지/탭 배지 표시
  byStatus: Record<ShelfStatus, number>;
  // 한 번도 hydrate 되지 않았으면 첫 진입 시 React Query 로 채울 수 있도록 플래그
  hydrated: boolean;

  hydrate: (items: { status: ShelfStatus }[]) => void;
  reset: () => void;
}

const EMPTY_BY_STATUS: Record<ShelfStatus, number> = {
  READING: 0,
  FINISHED: 0,
  FOR_SALE: 0,
  OWNED: 0,
};

export const useShelfStore = create<ShelfState>((set) => ({
  total: 0,
  byStatus: { ...EMPTY_BY_STATUS },
  hydrated: false,

  hydrate: (items) => {
    const byStatus = { ...EMPTY_BY_STATUS };
    for (const it of items) byStatus[it.status] += 1;
    set({ total: items.length, byStatus, hydrated: true });
  },

  reset: () =>
    set({ total: 0, byStatus: { ...EMPTY_BY_STATUS }, hydrated: false }),
}));
