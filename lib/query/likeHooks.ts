"use client";

// 찜(좋아요) 관련 React Query 훅 + Zustand 동기화
// ---------------------------------------------------------------
// - useHydrateLikes() : 로그인된 사용자의 찜 ID 전체를 한 번 가져와 store 에 채워둠
// - useBookLike(id)   : 단일 도서의 liked / count 를 store 에서 구독 + 토글 mutation 제공
// - useLikedBooks()   : /mypage/likes 화면용 — 찜한 책 카드 목록
//
// React Query 의 역할 : 서버 캐시 (listLikedBookIds, listLikedBooks)
// Zustand 의 역할     : 토글 결과를 다른 화면에 즉시 전파 (counts/liked)

import { useEffect } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useIsFetching,
} from "@tanstack/react-query";
import {
  isLiked as fetchIsLiked,
  listLikedBookIds,
  listLikedBooks,
  toggleLike,
} from "@/lib/repo";
import { useLikesStore, selectIsLiked, selectLikeCount } from "@/lib/store/likesStore";

export const likeKeys = {
  all: ["likes"] as const,
  ids: () => [...likeKeys.all, "ids"] as const,
  list: () => [...likeKeys.all, "list"] as const,
  one: (bookId: string) => [...likeKeys.all, "one", bookId] as const,
};

// 앱 시작 시(혹은 로그인 직후) 한 번 호출해 store 에 찜 ID 전체 hydration
// 컴포넌트 어디서든 한 번 마운트되면 store 가 채워진다
export function useHydrateLikes() {
  const hydrate = useLikesStore((s) => s.hydrate);
  const query = useQuery({
    queryKey: likeKeys.ids(),
    queryFn: async () => {
      const set = await listLikedBookIds();
      return Array.from(set);
    },
    staleTime: 5 * 60 * 1000, // 5분 — 토글은 mutation 으로 이미 동기화됨
  });

  useEffect(() => {
    if (query.data) hydrate({ likedIds: query.data });
  }, [query.data, hydrate]);

  return query;
}

// 단일 도서의 찜 여부 / 카운트 / 토글 액션
// - liked  : Zustand store 에서 구독 (다른 화면 토글에도 즉시 반응)
// - count  : Zustand store 에서 구독 (init 값은 호출자가 onInitCount 로 전달)
// - toggle : useMutation. 낙관적 업데이트 + 서버 응답으로 정정
export function useBookLike(bookId: string | undefined) {
  const queryClient = useQueryClient();
  const liked = useLikesStore(selectIsLiked(bookId ?? ""));
  const count = useLikesStore(selectLikeCount(bookId ?? ""));
  const setLiked = useLikesStore((s) => s.setLiked);
  const setCount = useLikesStore((s) => s.setCount);

  // 전역 hydration(useHydrateLikes) 결과가 캐시에 있으면 단건 fetch 스킵
  // → 리스트 화면에서 N개 카드가 N번 isLiked 쿼리를 날리는 것을 방지
  const hydratedIds = queryClient.getQueryData<string[]>(likeKeys.ids());
  const hydrating = useIsFetching({ queryKey: likeKeys.ids() }) > 0;
  useQuery({
    queryKey: likeKeys.one(bookId ?? ""),
    enabled: !!bookId && !hydratedIds && !hydrating,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!bookId) return false;
      const v = await fetchIsLiked(bookId);
      setLiked(bookId, v);
      return v;
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!bookId) throw new Error("bookId required");
      return toggleLike(bookId);
    },
    onMutate: async () => {
      if (!bookId) return;
      // 낙관적 업데이트 — UI 가 즉시 반응
      const prevLiked = liked;
      const prevCount = count;
      const optimisticLiked = !prevLiked;
      setLiked(bookId, optimisticLiked);
      if (typeof prevCount === "number") {
        setCount(
          bookId,
          Math.max(0, prevCount + (optimisticLiked ? 1 : -1))
        );
      }
      return { prevLiked, prevCount };
    },
    onError: (_err, _vars, ctx) => {
      // 실패 → 원복
      if (!bookId || !ctx) return;
      setLiked(bookId, ctx.prevLiked);
      if (typeof ctx.prevCount === "number") setCount(bookId, ctx.prevCount);
    },
    onSuccess: (res) => {
      if (!bookId) return;
      // 서버가 돌려준 정확한 값으로 정정
      setLiked(bookId, res.liked);
      setCount(bookId, res.likeCount);
    },
    onSettled: () => {
      // 관련 캐시 무효화 — 찜 목록 화면에서 자동 새로고침
      queryClient.invalidateQueries({ queryKey: likeKeys.list() });
      queryClient.invalidateQueries({ queryKey: likeKeys.ids() });
    },
  });

  return {
    liked,
    count,
    toggle: () => mutation.mutate(),
    isPending: mutation.isPending,
  };
}

// /mypage/likes 화면에서 사용하는 찜한 책 카드 목록
export function useLikedBooks() {
  return useQuery({
    queryKey: likeKeys.list(),
    queryFn: () => listLikedBooks(),
  });
}
