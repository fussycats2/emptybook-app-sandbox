// 알라딘 OpenAPI 데이터 — React Query 훅
// ---------------------------------------------------------------
// 현재는 베스트셀러 한 개. 추후 신간/특정 카테고리 등 추가 시 같은 파일에 모음.
// 키 미설정 / 알라딘 응답 실패는 throw 하지 않고 `{ unavailable: true }` 로 반환 —
// 호출자가 mock 폴백을 자연스럽게 쓰도록 (검색 페이지 "실시간 인기" 섹션 참조)

"use client";

import { useQuery } from "@tanstack/react-query";

export interface AladinBestsellerItem {
  title: string;
  author: string;
  isbn: string;
  cover: string;
}

interface BestsellerResponse {
  items?: AladinBestsellerItem[];
  unavailable?: boolean;
}

export function useAladinBestseller(limit = 10) {
  return useQuery<BestsellerResponse>({
    queryKey: ["aladin", "bestseller", limit],
    queryFn: async () => {
      const res = await fetch(`/api/aladin/bestseller?limit=${limit}`);
      // 503(키 미설정) / 502(알라딘 일시 장애) 는 throw 하지 않고 unavailable 신호로
      if (res.status === 503 || res.status === 502) {
        return { unavailable: true };
      }
      if (!res.ok) throw new Error(`Bestseller fetch failed: ${res.status}`);
      return res.json();
    },
    staleTime: 60 * 60 * 1000, // 1시간 — 서버 revalidate 와 정렬
    retry: 0, // unavailable 응답 retry 는 의미 없음
  });
}
