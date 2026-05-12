"use client";

// 도서 관련 React Query 훅
// - 조회: useRecentBooks, useSearchBooks, useBook, useMyBooks
// - 변경: useCreateBook, useCancelBook, useDeleteBook
// 변경 mutation 은 onSuccess 에서 관련된 list 캐시를 invalidate 해 자동 새로고침

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelBook,
  createBook,
  deleteBook,
  fetchBook,
  incrementBookView,
  listBooksByIds,
  listMyBooks,
  listRecentBooks,
  searchBooks,
  updateBook,
} from "@/lib/repo";
import { queryKeys } from "./keys";
import { likeKeys } from "./likeHooks";
import type { ConditionDetail } from "@/lib/supabase/types";

// 홈 피드 — 최근 등록 도서. region 이 주어지면 그 동네 책 우선 (v9.8)
export function useRecentBooks(limit = 10, region?: string) {
  return useQuery({
    queryKey: queryKeys.book.recent(limit, region),
    queryFn: () => listRecentBooks(limit, region),
  });
}

// 검색 — q/category/state 가 모두 비면 비활성 (불필요한 호출 방지)
export function useSearchBooks(params: {
  q?: string;
  category?: string;
  state?: string;
}) {
  const enabled = !!(params.q || params.category || params.state);
  return useQuery({
    queryKey: queryKeys.book.search(params),
    queryFn: () => searchBooks(params),
    enabled,
  });
}

// 주어진 id 배열로 책을 한 번에 가져온다 — 입력 순서 유지 (최근 본 상품 등에 사용)
export function useBooksByIds(ids: string[]) {
  return useQuery({
    queryKey: queryKeys.book.byIds(ids),
    queryFn: () => listBooksByIds(ids),
    // 빈 배열일 땐 호출 자체를 skip
    enabled: ids.length > 0,
  });
}

// 단건 도서 상세
export function useBook(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.book.detail(id ?? ""),
    queryFn: () => fetchBook(id!),
    enabled: !!id,
  });
}

// 조회수 +1 mutation — 도서 상세 useEffect 에서 한 번 호출.
// 본인 매물은 RPC 내부에서 noop. mutation 자체는 그냥 발사하고 결과는 다음 fetchBook 에서 반영.
export function useIncrementBookView() {
  return useMutation({
    mutationFn: (id: string) => incrementBookView(id),
  });
}

// 내가 등록한 책 (마이페이지/판매 내역)
export function useMyBooks() {
  return useQuery({
    queryKey: queryKeys.book.mine(),
    queryFn: () => listMyBooks(),
  });
}

// 게시글 수정 — 메타데이터 패치. 채팅/찜 목록은 join 으로 같은 책 정보를 보여주므로 함께 invalidate
export function useUpdateBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookId,
      patch,
    }: {
      bookId: string;
      patch: {
        state?: "최상" | "상" | "중" | "하";
        priceNumber?: number;
        free?: boolean;
        region?: string;
        description?: string;
        tradeMethod?: "DIRECT" | "PARCEL" | "BOTH";
        category?: string;
        conditionDetail?: ConditionDetail | null;
      };
    }) => updateBook(bookId, patch),
    onSuccess: (_ok, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.book.lists() });
      qc.invalidateQueries({ queryKey: queryKeys.book.detail(vars.bookId) });
      qc.invalidateQueries({ queryKey: queryKeys.chat.list() });
      qc.invalidateQueries({ queryKey: likeKeys.list() });
    },
  });
}

// 도서 등록
export function useCreateBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBook,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.book.lists() });
    },
  });
}

// 판매 취소 — 책의 status 가 HIDDEN 으로 바뀌면 다음 화면들도 영향:
//   - 채팅 목록(`listChats`): 책 status 가 join 으로 같이 들어가 배지가 변함
//   - 찜 목록(`listLikedBooks`): HIDDEN 책은 결과에서 빠짐
//   - 책장(0014 트리거): 연결된 FOR_SALE 항목이 OWNED 로 자동 전이됨
export function useCancelBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookId: string) => cancelBook(bookId),
    onSuccess: (_ok, bookId) => {
      qc.invalidateQueries({ queryKey: queryKeys.book.lists() });
      qc.invalidateQueries({ queryKey: queryKeys.book.detail(bookId) });
      qc.invalidateQueries({ queryKey: queryKeys.chat.list() });
      qc.invalidateQueries({ queryKey: likeKeys.list() });
      qc.invalidateQueries({ queryKey: queryKeys.shelf.lists() });
    },
  });
}

// 영구 삭제 — cancel 과 동일한 파급 (chat/likes/shelf 도 갱신)
// 책이 사라지면 shelf_items.linked_book_id 는 ON DELETE SET NULL 로 자동 null 화
export function useDeleteBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookId: string) => deleteBook(bookId),
    onSuccess: (_ok, bookId) => {
      qc.invalidateQueries({ queryKey: queryKeys.book.lists() });
      qc.invalidateQueries({ queryKey: queryKeys.book.detail(bookId) });
      qc.invalidateQueries({ queryKey: queryKeys.chat.list() });
      qc.invalidateQueries({ queryKey: likeKeys.list() });
      qc.invalidateQueries({ queryKey: queryKeys.shelf.lists() });
    },
  });
}
