"use client";

// TanStack Query 클라이언트 — 앱 전역 캐싱 / 무효화 / mutation 의 진입점
// - QueryClient 는 한 번만 생성하고 useState 로 보존 (StrictMode 더블 마운트에서도 안전)
// - staleTime / refetchOnWindowFocus 등 기본값은 모바일 웹 흐름에 맞춰 보수적으로 설정
// - app/providers.tsx 에서 AuthProvider 바깥쪽에 감싸 모든 컴포넌트가 useQuery/useMutation 사용 가능

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 30초 동안은 fresh 로 간주 — 네트워크 폭주 방지
            staleTime: 30 * 1000,
            // 모바일 웹: 포커스마다 자동 재요청은 부담 → off
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
