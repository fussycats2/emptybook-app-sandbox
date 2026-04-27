// Next.js App Router의 루트 레이아웃 (모든 페이지를 감싸는 최상위 HTML)
// - 폰트(Pretendard) 로드
// - Providers (테마/토스트/Auth 컨텍스트) 주입
// - PhoneFrame 으로 모바일 카드 모양 프레임 적용

import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";
import PhoneFrame from "@/components/ui/PhoneFrame";

// 브라우저 탭 제목/검색엔진용 메타 정보
export const metadata: Metadata = {
  title: "책장비움 — EmptyBook",
  description: "내 책장의 책을 효율적으로 비우고 이웃과 중고 도서를 거래하는 플랫폼",
};

// 모바일에서 사용자가 화면을 확대(핀치 줌)하지 못하게 고정 — 디자인 무너짐 방지
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* preconnect: 폰트 CDN 핸드셰이크를 미리 끝내 폰트 로딩 속도 단축 */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body>
        <Providers>
          <PhoneFrame>{children}</PhoneFrame>
        </Providers>
      </body>
    </html>
  );
}
