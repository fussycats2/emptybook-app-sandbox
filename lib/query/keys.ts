// React Query key 팩토리 — 도메인별 일관된 invalidation 을 위해 한 파일에 모은다
// 규칙: ["domain", "list" | "detail" | "params...", ...args]
//   - list 무효화 시 invalidateQueries({ queryKey: keys.book.lists() }) 만 부르면 모든 리스트가 한 번에 갱신
//   - detail 은 id 별 분리

export const queryKeys = {
  book: {
    all: ["book"] as const,
    lists: () => [...queryKeys.book.all, "list"] as const,
    recent: (limit: number) => [...queryKeys.book.lists(), "recent", limit] as const,
    search: (params: { q?: string; category?: string; state?: string }) =>
      [...queryKeys.book.lists(), "search", params] as const,
    mine: () => [...queryKeys.book.lists(), "mine"] as const,
    // ids 입력 순서가 결과 순서를 좌우하므로 키 자체에도 그대로 포함 (정렬 X)
    byIds: (ids: string[]) => [...queryKeys.book.lists(), "byIds", ids] as const,
    detail: (id: string) => [...queryKeys.book.all, "detail", id] as const,
  },
  order: {
    all: ["order"] as const,
    list: () => [...queryKeys.order.all, "list"] as const,
    detail: (id: string) => [...queryKeys.order.all, "detail", id] as const,
  },
  chat: {
    all: ["chat"] as const,
    list: () => [...queryKeys.chat.all, "list"] as const,
    detail: (id: string) => [...queryKeys.chat.all, "detail", id] as const,
  },
  notification: {
    all: ["notification"] as const,
    list: () => [...queryKeys.notification.all, "list"] as const,
  },
  profile: {
    all: ["profile"] as const,
    me: () => [...queryKeys.profile.all, "me"] as const,
    receivedReviews: (uid?: string) =>
      [...queryKeys.profile.all, "receivedReviews", uid ?? "self"] as const,
  },
  review: {
    all: ["review"] as const,
    context: (txId: string) => [...queryKeys.review.all, "context", txId] as const,
  },
  naverBooks: {
    all: ["naverBooks"] as const,
    search: (q: string) => [...queryKeys.naverBooks.all, q] as const,
  },
};
