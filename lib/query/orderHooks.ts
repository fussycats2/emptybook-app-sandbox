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
    mutationFn: (input: { bookId: string; userCouponId?: string }) =>
      createOrder(input),
    onSuccess: (_res, input) => {
      qc.invalidateQueries({ queryKey: queryKeys.order.list() });
      // 책 status 가 SOLD 로 바뀌므로 도서 리스트/상세 + 채팅 목록(책 배지) 갱신
      qc.invalidateQueries({ queryKey: queryKeys.book.lists() });
      qc.invalidateQueries({
        queryKey: queryKeys.book.detail(input.bookId),
      });
      qc.invalidateQueries({ queryKey: queryKeys.chat.list() });
      // 0014 트리거가 책장 FOR_SALE → OWNED 로 자동 전이시키므로 책장 캐시도 갱신
      // 0016 트리거가 buyer 책장에 OWNED 로 자동 추가하므로 같은 invalidate 가 반영
      qc.invalidateQueries({ queryKey: queryKeys.shelf.lists() });
      // 쿠폰을 같이 적용했으면 status 가 USED 로 바뀌었으니 쿠폰 목록 캐시도 갱신
      if (input.userCouponId) {
        qc.invalidateQueries({ queryKey: queryKeys.coupon.list() });
      }
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
