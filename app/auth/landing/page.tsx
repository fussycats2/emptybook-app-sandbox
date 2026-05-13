// OAuth 콜백 후 잠시 머무는 로딩 페이지 (/auth/landing).
// - 네이버/구글 콜백이 세션 쿠키를 심고 곧바로 /home 으로 redirect 하면,
//   브라우저는 /home HTML 다운로드 + JS hydrate + 데이터 fetch 동안 빈 셸을 보여준다.
// - 사용자 체감으로는 "로그인 직후 한참 빈 화면" — 브랜드 톤이 깨짐.
// - 이 페이지가 BookLoader 를 즉시 띄우고, AuthProvider 의 user 가 hydrate 되면
//   ?next 로 router.replace 한다.
//
// 이 파일은 server component 래퍼 — useSearchParams 를 쓰는 client 부분은
// `LandingClient` 로 분리하고 <Suspense> 로 감싼다 (Next 14 prerender 가드).
// theme 토큰은 client 모듈이라 Fallback 도 client 로 분리 (LandingFallback).

import { Suspense } from "react";
import LandingClient, { LandingFallback } from "./LandingClient";

export default function AuthLandingPage() {
  return (
    <Suspense fallback={<LandingFallback />}>
      <LandingClient />
    </Suspense>
  );
}
