"use client";

// 쿠폰 React Query 훅 (0017)
// - useMyCoupons : 내 쿠폰 전체 (만료 자동 처리 후 반환)
// - useCoupon    : 단건 (결제 시 적용 검증용)

import { useQuery } from "@tanstack/react-query";
import { getCoupon, listMyCoupons } from "@/lib/repo";
import { queryKeys } from "./keys";

export function useMyCoupons() {
  return useQuery({
    queryKey: queryKeys.coupon.list(),
    queryFn: () => listMyCoupons(),
  });
}

export function useCoupon(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.coupon.detail(id ?? ""),
    queryFn: () => getCoupon(id!),
    enabled: !!id,
  });
}
