"use client";

// 책장(shelf) 관련 React Query 훅
// 조회 / 추가 / 수정 / 삭제 — 모든 mutation 은 list 캐시 invalidate.
// listMyShelf 데이터를 받으면 shelfStore 에도 카운트를 동기화 (마이페이지 STATS / 홈 바로가기에서 사용)

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addShelfItem,
  getShelfItem,
  listMyShelf,
  removeShelfItem,
  updateShelfItem,
} from "@/lib/repo";
import type { ShelfStatus } from "@/lib/supabase/types";
import { queryKeys } from "./keys";
import { useShelfStore } from "@/lib/store/shelfStore";

// 전체 또는 특정 상태의 책장 목록
export function useMyShelf(filter?: ShelfStatus) {
  const hydrate = useShelfStore((s) => s.hydrate);
  const q = useQuery({
    queryKey: queryKeys.shelf.list(filter),
    queryFn: () => listMyShelf(filter),
  });
  // 전체 목록을 받을 때만 store 에 카운트 동기화 (필터 결과로 카운트가 왜곡되지 않게)
  useEffect(() => {
    if (!filter && q.data) hydrate(q.data);
  }, [filter, q.data, hydrate]);
  return q;
}

export function useShelfItem(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.shelf.detail(id ?? ""),
    queryFn: () => getShelfItem(id!),
    enabled: !!id,
  });
}

export function useAddShelfItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addShelfItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.shelf.lists() });
    },
  });
}

export function useUpdateShelfItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Parameters<typeof updateShelfItem>[1];
    }) => updateShelfItem(id, patch),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.shelf.lists() });
      qc.invalidateQueries({ queryKey: queryKeys.shelf.detail(id) });
    },
  });
}

export function useRemoveShelfItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeShelfItem(id),
    onSuccess: (_ok, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.shelf.lists() });
      qc.removeQueries({ queryKey: queryKeys.shelf.detail(id) });
    },
  });
}
