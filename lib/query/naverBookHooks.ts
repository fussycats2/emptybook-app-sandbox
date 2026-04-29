"use client";

// 네이버 도서 검색 — /api/books/search Route Handler 호출
// 등록 폼에서 디바운스 + 사용자가 명시적으로 "검색" 버튼 누를 때 발사

import { useMutation } from "@tanstack/react-query";

export type NaverBookItem = {
  title: string;
  author?: string;
  publisher?: string;
  isbn?: string;
  image?: string;
  description?: string;
};

async function searchNaverBooks(q: string): Promise<NaverBookItem[]> {
  if (!q.trim()) return [];
  const res = await fetch(`/api/books/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error("네이버 검색 실패");
  const json = await res.json();
  return json.items ?? [];
}

// 검색은 사용자 액션(버튼 클릭) 시 1회만 — useQuery 보다 useMutation 이 잘 맞는다
// (자동 재요청 / 캐시 키 충돌 X)
export function useNaverBookSearch() {
  return useMutation({
    mutationFn: (q: string) => searchNaverBooks(q),
  });
}
