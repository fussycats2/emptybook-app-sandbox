// 알라딘 ItemList API 프록시 — 검색 페이지 "실시간 인기" 섹션에서 사용
// ---------------------------------------------------------------
// - TTBKey 는 server-only 환경변수 (`ALADIN_TTB_KEY`) — 브라우저에 노출되면 안 됨
// - QueryType=Bestseller, SearchTarget=Book 으로 종합 베스트셀러 가져오기
// - Next.js fetch revalidate 1시간 — 알라딘 트래픽 절약 + 베타 시연 트래픽 폭주 방지
// - 키 미설정 / 알라딘 응답 실패 시 `{ unavailable: true }` 로 응답해 클라이언트가
//   기존 mock(POPULAR_SEARCHES) 폴백을 그대로 쓰도록 신호 보냄
//
// 키 발급: https://www.aladin.co.kr/ttb/wblog_manage.aspx → 회원가입 후 OpenAPI 키 발급
// API 문서: http://blog.aladin.co.kr/openapi

import { NextRequest, NextResponse } from "next/server";

const ALADIN_URL = "https://www.aladin.co.kr/ttb/api/ItemList.aspx";

// 알라딘 응답에서 우리가 쓰는 필드만 추려 normalize
interface AladinBestsellerItem {
  title: string;
  author: string;
  isbn: string;
  cover: string;
}

// 제목 끝의 "(부제)" / "[시리즈]" / "(전2권)" 같은 부가 표기 제거 — 검색어로 쓰기 좋게
function stripParenthesis(text: string): string {
  return text.split(/[(（[]/)[0].trim();
}

export async function GET(request: NextRequest) {
  const ttbKey = process.env.ALADIN_TTB_KEY;
  if (!ttbKey) {
    return NextResponse.json({ unavailable: true, reason: "no_key" }, { status: 503 });
  }

  // limit 1~50 강제 — 알라딘 max 가 50
  const rawLimit = parseInt(request.nextUrl.searchParams.get("limit") || "10", 10);
  const limit = Math.max(1, Math.min(rawLimit || 10, 50));

  const url = new URL(ALADIN_URL);
  url.searchParams.set("ttbkey", ttbKey);
  url.searchParams.set("QueryType", "Bestseller");
  url.searchParams.set("MaxResults", String(limit));
  url.searchParams.set("start", "1");
  url.searchParams.set("SearchTarget", "Book");
  url.searchParams.set("output", "js");
  url.searchParams.set("Version", "20131101");

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 }, // 1시간 동안 캐시 — 베스트셀러는 분 단위로 안 바뀜
    });
    if (!res.ok) throw new Error(`Aladin HTTP ${res.status}`);
    const text = await res.text();
    const data = JSON.parse(text);
    const items: AladinBestsellerItem[] = (data.item ?? []).map((it: Record<string, unknown>) => ({
      title: stripParenthesis(String(it.title ?? "")),
      author: String(it.author ?? ""),
      isbn: String(it.isbn13 || it.isbn || ""),
      cover: String(it.cover ?? ""),
    }));
    return NextResponse.json({ items });
  } catch (err) {
    // 알라딘 일시 장애 / 키 만료 등 — 클라이언트 폴백에 맡김
    return NextResponse.json(
      { unavailable: true, reason: "fetch_failed", error: String(err) },
      { status: 502 },
    );
  }
}
