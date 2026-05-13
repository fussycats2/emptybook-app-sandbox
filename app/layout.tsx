// Next.js App Router의 루트 레이아웃 (모든 페이지를 감싸는 최상위 HTML)
// - 폰트(Pretendard) 로드
// - Providers (테마/토스트/Auth 컨텍스트) 주입
// - PhoneFrame 으로 모바일 카드 모양 프레임 적용

import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";
import PhoneFrame from "@/components/ui/PhoneFrame";

// 사이트 절대 URL — OG/Twitter card 의 og:url, og:image absolute 처리에 사용.
// 환경변수가 없으면 dev 용 localhost 로 폴백.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// 브라우저 탭 제목/검색엔진용 + OG/Twitter 카드 메타 정보
// - title.template: 자식 페이지가 title 만 지정해도 자동으로 " — EmptyBook" suffix 가 붙음.
// - metadataBase: 상대 경로(예: opengraph-image.tsx 가 자동 생성하는 /opengraph-image)
//   를 절대 URL 로 확장하기 위해 필요.
// - 보호 라우트는 robots.ts 에서 disallow — 여기선 글로벌 index/follow 로 두고 라우트별 제어.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "책장비움 — EmptyBook",
    template: "%s — EmptyBook",
  },
  description:
    "내 책장의 책을 비우고 이웃과 중고 도서를 거래해요. 사진 한 장으로 등록하고, 채팅으로 바로 만나는 동네 책장.",
  applicationName: "EmptyBook",
  keywords: [
    "중고책",
    "중고도서",
    "책장비움",
    "EmptyBook",
    "당근마켓 책",
    "동네 책 거래",
    "도서 중고거래",
    "독서 기록",
  ],
  authors: [{ name: "EmptyBook" }],
  creator: "EmptyBook",
  formatDetection: { telephone: false, address: false, email: false },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "EmptyBook",
    locale: "ko_KR",
    url: "/",
    title: "책장비움 — EmptyBook",
    description:
      "내 책장의 책을 비우고 이웃과 중고 도서를 거래해요. 사진 한 장으로 등록하고, 채팅으로 바로 만나는 동네 책장.",
  },
  twitter: {
    card: "summary_large_image",
    title: "책장비움 — EmptyBook",
    description:
      "내 책장의 책을 비우고 이웃과 중고 도서를 거래해요. 사진 한 장으로 등록하고, 채팅으로 바로 만나는 동네 책장.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// 모바일에서 사용자가 화면을 확대(핀치 줌)하지 못하게 고정 — 디자인 무너짐 방지.
// themeColor — 모바일 브라우저 주소창/상태바에 브랜드 색이 적용됨 (theme palette.bg 와 일치).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#F7F4ED",
  colorScheme: "light",
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
