// 테스트 공용 헬퍼.
// - renderWithProviders: MUI ThemeProvider + React Query QueryClient + (필요 시) AuthProvider mock 로 wrap.
// - createTestQueryClient: 테스트마다 fresh QueryClient (retry off, gc 0) 를 생성해 캐시 leak 방지.
//
// 일부러 AppRouterCacheProvider 는 빼고 ThemeProvider 만 — emotion SSR 캐시는 클라 테스트에 불필요.

import { ReactElement, ReactNode } from "react";
import {
  render,
  type RenderOptions,
  type RenderResult,
} from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import theme from "@/lib/theme";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: { retry: false },
    },
  });
}

interface ProvidersProps {
  children: ReactNode;
  client?: QueryClient;
}

function AllProviders({ children, client }: ProvidersProps) {
  const qc = client ?? createTestQueryClient();
  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult & { queryClient: QueryClient } {
  const { queryClient, ...rest } = options;
  const qc = queryClient ?? createTestQueryClient();
  const utils = render(ui, {
    wrapper: ({ children }) => (
      <AllProviders client={qc}>{children}</AllProviders>
    ),
    ...rest,
  });
  return { ...utils, queryClient: qc };
}

// jest-dom matchers 가 살아 있는지 확인하는 sanity export
export { theme as testTheme };
