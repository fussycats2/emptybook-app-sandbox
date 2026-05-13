// /sitemap.xml — 검색엔진에 노출시킬 공개 라우트 목록.
// 보호 라우트(/mypage, /chat, /checkout 등) 와 인증 흐름(/login, /auth, /find-account)은 제외.
// 도서 상세(/books/[id]) 는 매물 단위라 자주 바뀌고 동적 데이터에 의존 — 베타에서는 sitemap 에
// 정적 라우트만 등록하고 매물별 url 은 일단 보류 (Supabase 호출까지 가야 풀 리스트). 차후 도입.

import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// 우선순위: 홈/검색은 1.0, 정보성 페이지는 0.4
const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1.0, changeFrequency: "daily" },
  { path: "/home", priority: 1.0, changeFrequency: "daily" },
  { path: "/search", priority: 0.9, changeFrequency: "daily" },
  { path: "/login", priority: 0.3, changeFrequency: "yearly" },
  { path: "/signup", priority: 0.3, changeFrequency: "yearly" },
  { path: "/notices", priority: 0.4, changeFrequency: "monthly" },
  { path: "/help", priority: 0.4, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/licenses", priority: 0.2, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
