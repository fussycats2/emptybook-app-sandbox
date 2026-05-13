"use client";

// /auth/landing 의 client 부분 — useSearchParams + useAuth + replace.
// page.tsx 가 server wrapper 로 Suspense 감싸기 때문에 분리됨.
// LandingFallback 도 client 로 함께 export — server page 에서 import 해서
// Suspense fallback 으로 쓴다 (theme 토큰을 server 모듈에서 직접 참조하면
// RSC manifest 에 client export 가 잡혀 prerender 가 깨짐).

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box } from "@mui/material";
import BookLoader from "@/components/ui/BookLoader";
import { useAuth } from "@/lib/auth/AuthProvider";
import { palette } from "@/lib/theme";

// 공용 로딩 UI — Suspense fallback 과 hydrate 직후 화면 양쪽에서 동일하게 사용.
export function LandingFallback() {
  return (
    <Box
      sx={{
        position: "relative",
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: palette.bg,
        minHeight: "60vh",
      }}
    >
      <BookLoader size={68} label="로그인 중이에요…" />
    </Box>
  );
}

export default function LandingClient() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading } = useAuth();

  // open redirect 방어 — 같은 origin 의 절대경로(`/...`)만 허용
  const rawNext = params.get("next") ?? "/home";
  const safeNext =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/home";

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace(safeNext);
    } else {
      // 세션 hydrate 가 끝났는데 user 가 없으면 콜백 실패 / 직접 접근 — login 으로
      router.replace("/login?error=oauth");
    }
  }, [loading, user, safeNext, router]);

  return <LandingFallback />;
}
