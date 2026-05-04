// 네이버 도서 검색 API 프록시 (Next.js Route Handler — 서버에서 실행)
// - 클라이언트는 /api/books/search?q=... 또는 ?isbn=... 로 호출
// - 네이버 OpenAPI 는 CORS가 막혀있어 반드시 서버에서 호출해야 함
// - Client Secret 은 NAVER_CLIENT_SECRET (NEXT_PUBLIC_ 금지)
//
// 네이버 응답 → 우리 앱이 쓰는 정규화된 형태로 변환:
//   { items: [{ title, author, publisher, isbn, image, price, description, pubdate }] }

import { NextResponse, type NextRequest } from "next/server";

// 네이버 응답 한 항목의 형태 (필요한 필드만)
type NaverItem = {
  title: string;
  link: string;
  image: string;
  author: string;
  price: string;
  discount: string;
  publisher: string;
  pubdate: string;
  isbn: string; // "ISBN10 ISBN13" 공백 구분
  description: string;
};

// 우리 앱에서 쓸 정규화된 형태
export type BookSearchItem = {
  title: string;
  author: string;
  publisher: string;
  isbn: string; // ISBN13 우선, 없으면 ISBN10
  image: string;
  price: number; // 정가(원)
  description: string;
  pubdate: string; // YYYY-MM-DD 또는 빈 문자열
  link: string; // 네이버 도서 상세 페이지 URL — 도서 상세에서 "외부 정보 보기" 링크로 활용
};

// 네이버 응답에 섞인 <b>...</b> 강조 태그 제거
function stripTags(s: string | undefined): string {
  if (!s) return "";
  return s
    .replace(/<\/?b>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// "8936434268 9788936434267" → ISBN13 우선
function pickIsbn(raw: string): string {
  if (!raw) return "";
  const parts = raw.split(/\s+/).filter(Boolean);
  return parts.find((p) => p.length === 13) ?? parts[0] ?? "";
}

// "20071030" → "2007-10-30"
function formatPubdate(raw: string): string {
  if (!raw || raw.length !== 8) return "";
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

function normalize(item: NaverItem): BookSearchItem {
  return {
    title: stripTags(item.title),
    author: stripTags(item.author).replace(/\^/g, ", "), // 공동저자 구분자(^) → 쉼표
    publisher: stripTags(item.publisher),
    isbn: pickIsbn(item.isbn),
    image: item.image ?? "",
    price: parseInt(item.price || "0", 10) || 0,
    description: stripTags(item.description),
    pubdate: formatPubdate(item.pubdate),
    link: item.link ?? "",
  };
}

// 13자리 또는 10자리 숫자만 들어오면 ISBN으로 간주
function looksLikeIsbn(s: string): boolean {
  const stripped = s.replace(/[-\s]/g, "");
  return /^\d{13}$/.test(stripped) || /^\d{10}$/.test(stripped);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const isbnParam = (searchParams.get("isbn") ?? "").trim();

  if (!q && !isbnParam) {
    return NextResponse.json(
      { error: "q 또는 isbn 쿼리스트링이 필요합니다" },
      { status: 400 }
    );
  }

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    // 키 미설정 시 빈 결과 — 화면이 깨지지 않도록
    return NextResponse.json(
      { items: [], error: "NAVER_CLIENT_ID/SECRET 미설정" },
      { status: 200 }
    );
  }

  // ISBN 모드 우선: 명시적 isbn 파라미터 또는 q 가 ISBN 형태일 때
  const useIsbn = !!isbnParam || (!!q && looksLikeIsbn(q));
  const isbnValue = (isbnParam || q).replace(/[-\s]/g, "");

  const url = useIsbn
    ? `https://openapi.naver.com/v1/search/book_adv.json?d_isbn=${encodeURIComponent(
        isbnValue
      )}`
    : `https://openapi.naver.com/v1/search/book.json?query=${encodeURIComponent(
        q
      )}&display=10`;

  try {
    const res = await fetch(url, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
      // 네이버 결과는 변동이 거의 없어 짧게 캐싱 (10분)
      next: { revalidate: 600 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { items: [], error: `네이버 API 오류 (${res.status})` },
        { status: 200 }
      );
    }
    const data = (await res.json()) as { items?: NaverItem[] };
    const items = (data.items ?? []).map(normalize);
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json(
      { items: [], error: "네이버 API 호출 실패" },
      { status: 200 }
    );
  }
}
