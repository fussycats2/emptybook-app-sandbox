"use client";

// 클라이언트 전용 Provider 모음 — layout.tsx 에서 한 번만 주입한다
// 순서가 중요: 바깥에서 안쪽 Provider 의 컨텍스트를 사용할 수 없으므로
//   AppRouter cache > MUI Theme > Auth > Toast > children 순으로 감쌈

import { ThemeProvider, CssBaseline } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import theme from "@/lib/theme";
import ToastProvider from "@/components/ui/ToastProvider";
import AuthProvider from "@/lib/auth/AuthProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    // SSR 시 MUI 의 emotion 스타일이 깜빡이지 않도록 캐시 처리
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ThemeProvider theme={theme}>
        {/* CssBaseline: 브라우저 기본 마진/폰트를 정리해 일관된 시작점 만들기 */}
        <CssBaseline />
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
