"use client";

// 거래/주문 관련 React Query 훅
// - useOrders : 내 거래(구매+판매) 전체
// - useOrder  : 단건 (결제완료 / 거래확정 화면)
// - useCreateOrder : 결제 진행 mutation. 책 status 도 SOLD 로 바뀌므로 도서 캐시 invalidate
// - useCompleteOrder : 거래 확정 mutation

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  completeOrder,
  createOrder,
  fetchOrder,
  listOrders,
} from "@/lib/repo";
import { queryKeys } from "./keys";

export function useOrders() {
  return useQuery({
    queryKey: queryKeys.order.list(),
    queryFn: () => listOrders(),
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.order.detail(id ?? ""),
    queryFn: () => fetchOrder(id!),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { bookId: string }) => createOrder(input),
    onSuccess: (_res, input) => {
      qc.invalidateQueries({ queryKey: queryKeys.order.list() });
      // 책 status 가 SOLD 로 바뀌므로 도서 리스트/상세 캐시도 무효화
      qc.invalidateQueries({ queryKey: queryKeys.book.lists() });
      qc.invalidateQueries({
        queryKey: queryKeys.book.detail(input.bookId),
      });
    },
  });
}

export function useCompleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => completeOrder(id),
    onSuccess: (_res, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.order.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.order.list() });
    },
  });
}
