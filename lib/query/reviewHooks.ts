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
      // 후기 1건 추가 → reviewee 의 rating_avg / trade_count 가 0003 트리거로 갱신된다.
      // 이 값은 여러 화면에서 join 으로 노출되므로 관련 캐시도 함께 invalidate 해야
      // "받은 후기는 늘었는데 매너온도/거래수는 그대로" 같은 부분 동기화 버그가 안 생긴다.
      qc.invalidateQueries({
        queryKey: queryKeys.profile.receivedReviews(input.revieweeId),
      });
      qc.invalidateQueries({
        queryKey: queryKeys.review.context(input.transactionId),
      });
      // book.detail / book.list 가 seller 의 rating/trade_count 를 join 해 보여줌
      qc.invalidateQueries({ queryKey: queryKeys.book.all });
      // 채팅 목록/상세는 partner 의 rating_avg/trade_count 를 헤더에 그림
      qc.invalidateQueries({ queryKey: queryKeys.chat.all });
      // 마이페이지 본인 카드의 매너온도/거래수도 받은 후기 수에 따라 갱신되어야 함
      qc.invalidateQueries({ queryKey: queryKeys.profile.me() });
    },
  });
}
