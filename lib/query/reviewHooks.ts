"use client";

// 후기 작성 화면(/orders/[id]/review) 전용 훅
// - useReviewContext : 거래 정보 + 상대방 + 이미 작성 여부 한 번에
// - useCreateReview  : 작성 mutation. 성공/이미존재 분기 호출자가 처리

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createReview,
  fetchReviewContext,
  type ReviewContext,
} from "@/lib/repo";
import { queryKeys } from "./keys";

export function useReviewContext(transactionId: string | undefined) {
  return useQuery<ReviewContext | null>({
    queryKey: queryKeys.review.context(transactionId ?? ""),
    queryFn: () => fetchReviewContext(transactionId!),
    enabled: !!transactionId,
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      transactionId: string;
      revieweeId: string;
      rating: number;
      tags: string[];
      comment?: string;
    }) => createReview(input),
    onSuccess: (_res, input) => {
      // 후기 1건 추가 → 받은 후기 목록(상대방) + 컨텍스트 invalidate
      qc.invalidateQueries({
        queryKey: queryKeys.profile.receivedReviews(input.revieweeId),
      });
      qc.invalidateQueries({
        queryKey: queryKeys.review.context(input.transactionId),
      });
    },
  });
}
