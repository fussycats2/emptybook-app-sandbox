// 검색엔진 크롤러 규칙. /robots.txt 응답으로 제공됨.
// - 보호 라우트(미들웨어 PROTECTED_PREFIXES 와 동일) 는 disallow — 로그인 안 한 크롤러가
//   접근해도 어차피 /login 으로 리다이렉트되지만, 인덱스 낭비/노이즈 방지 차원에서 명시.
// - API 라우트는 모두 disallow (검색 결과에 JSON 응답이 노출될 일 없게).

import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/register",
          "/checkout",
          "/orders",
          "/chat",
          "/mypage",
          "/notifications",
          "/reset-password",
          "/spine-preview",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
