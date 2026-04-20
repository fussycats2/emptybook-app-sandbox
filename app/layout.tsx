import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";
import PhoneFrame from "@/components/ui/PhoneFrame";

export const metadata: Metadata = {
  title: "책장비움 — EmptyBook",
  description: "내 책장의 책을 효율적으로 비우고 이웃과 중고 도서를 거래하는 플랫폼",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
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
