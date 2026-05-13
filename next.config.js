/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // 외부 이미지 도메인 — Supabase storage(book-images) + 네이버 도서 표지 + 알라딘 표지.
  // next/image 도입 시 자동 최적화(웹P, 사이즈 변환) 대상이 됨. 지금은 <img> 가 대부분이지만
  // 도메인 등록은 미리 — 일부 화면(/auth/landing 등) 에서 사용 시 빌드 에러 없게.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "shopping-phinf.pstatic.net" }, // 네이버 도서 표지
      { protocol: "https", hostname: "image.aladin.co.kr" }, // 알라딘 베스트셀러 표지
      { protocol: "https", hostname: "ssl.pstatic.net" }, // 네이버 보조 이미지 호스트
    ],
  },

  // tree-shake 강화 — 배럴 import 가 deep import 로 자동 변환되어 chunk 사이즈 감소.
  // MUI 6 + icons-material 이 가장 큰 효과. react-query 도 함께 등록.
  experimental: {
    optimizePackageImports: [
      "@mui/material",
      "@mui/icons-material",
      "@mui/material-nextjs",
      "@tanstack/react-query",
    ],
  },

  // 프로덕션 빌드에서 console.log 만 제거 (warn / error 는 살림 — 운영 디버깅용).
  // 개발 빌드는 그대로 유지.
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["warn", "error"] }
        : false,
  },
};

module.exports = nextConfig;
