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
  listBooksByIds,
  listMyBooks,
  listRecentBooks,
  searchBooks,
} from "@/lib/repo";
import { queryKeys } from "./keys";
import { likeKeys } from "./likeHooks";

// 홈 피드 — 최근 등록 도서
export function useRecentBooks(limit = 10) {
  return useQuery({
    queryKey: queryKeys.book.recent(limit),
    queryFn: () => listRecentBooks(limit),
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

// 내가 등록한 책 (마이페이지/판매 내역)
export function useMyBooks() {
  return useQuery({
    queryKey: queryKeys.book.mine(),
    queryFn: () => listMyBooks(),
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
export function useCancelBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookId: string) => cancelBook(bookId),
    onSuccess: (_ok, bookId) => {
      qc.invalidateQueries({ queryKey: queryKeys.book.lists() });
      qc.invalidateQueries({ queryKey: queryKeys.book.detail(bookId) });
      qc.invalidateQueries({ queryKey: queryKeys.chat.list() });
      qc.invalidateQueries({ queryKey: likeKeys.list() });
    },
  });
}

// 영구 삭제 — cancel 과 동일한 파급 (chat/likes 도 갱신)
export function useDeleteBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookId: string) => deleteBook(bookId),
    onSuccess: (_ok, bookId) => {
      qc.invalidateQueries({ queryKey: queryKeys.book.lists() });
      qc.invalidateQueries({ queryKey: queryKeys.book.detail(bookId) });
      qc.invalidateQueries({ queryKey: queryKeys.chat.list() });
      qc.invalidateQueries({ queryKey: likeKeys.list() });
    },
  });
}
