// Jest 테스트 환경 공통 셋업.
// - @testing-library/jest-dom: toBeInTheDocument 등 DOM 매처 등록.
// - jsdom 미구현 API 폴리필 (matchMedia, scrollTo, IntersectionObserver).
// - next/navigation 모킹 — App Router 훅(useRouter/usePathname/useParams/useSearchParams) 기본값.
// - next/link 는 anchor 그대로 (Link 가 prefetch 호출하다 fail 하는 거 회피).
// - lib/auth/AuthProvider 의 useAuth 는 비로그인 상태 기본 — 필요한 테스트는 개별 jest.mock 으로 덮어쓰면 됨.

import "@testing-library/jest-dom";

// ---------- jsdom 미구현 API 폴리필 ----------

if (typeof window !== "undefined") {
  if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }

  if (!window.scrollTo) {
    Object.defineProperty(window, "scrollTo", {
      writable: true,
      value: () => {},
    });
  }

  if (!(window as any).IntersectionObserver) {
    (window as any).IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    };
  }
}

// ---------- next/navigation 기본 모킹 ----------

const pushMock = jest.fn();
const replaceMock = jest.fn();
const backMock = jest.fn();
const prefetchMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
    back: backMock,
    prefetch: prefetchMock,
    refresh: jest.fn(),
    forward: jest.fn(),
  }),
  usePathname: () => "/",
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
  redirect: jest.fn(),
  notFound: jest.fn(),
}));

// 각 테스트마다 mock 호출 기록 초기화 — 누적되면 다른 테스트의 검증을 오염시킴
beforeEach(() => {
  pushMock.mockClear();
  replaceMock.mockClear();
  backMock.mockClear();
  prefetchMock.mockClear();
});

// 테스트에서 라우터 mock 호출을 조회하고 싶을 때 사용
export const __nextRouterMocks = {
  push: pushMock,
  replace: replaceMock,
  back: backMock,
  prefetch: prefetchMock,
};

// ---------- next/link → 단순 anchor ----------
// MUI Button + Next Link 조합이 prefetch 시 fetch 호출하다 jsdom 에서 unhandled 됨.

jest.mock("next/link", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ href, children, ...rest }: any) =>
      React.createElement("a", { href, ...rest }, children),
  };
});

// ---------- AuthProvider — 기본 비로그인 ----------
// 컴포넌트가 useAuth 를 직접/간접 호출하면 실 Supabase client 가 켜져버려 jsdom 에서 위험.
// 비로그인 user=null, loading=false 가 기본. 로그인 상태 필요하면 개별 테스트에서 다시 jest.mock.

jest.mock("@/lib/auth/AuthProvider", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: null,
    loading: false,
    signOut: jest.fn(),
  }),
}));
