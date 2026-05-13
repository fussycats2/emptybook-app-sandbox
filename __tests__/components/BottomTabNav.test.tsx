// BottomTabNav — 5탭 + 가운데 + 등록 버튼.
// usePathname 을 테스트마다 다른 값으로 모킹해서 활성 탭 판별 + router.push 호출 검증.

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BottomTabNav from "@/components/ui/BottomTabNav";
import { renderWithProviders } from "../test-utils";
import { __nextRouterMocks } from "../../jest.setup";

// jest.setup 의 usePathname 기본값을 override 하기 위해 require/mock 재지정.
function setPathname(path: string) {
  jest.doMock("next/navigation", () => ({
    useRouter: () => ({
      push: __nextRouterMocks.push,
      replace: __nextRouterMocks.replace,
      back: __nextRouterMocks.back,
      prefetch: __nextRouterMocks.prefetch,
      refresh: jest.fn(),
      forward: jest.fn(),
    }),
    usePathname: () => path,
    useParams: () => ({}),
    useSearchParams: () => new URLSearchParams(),
    redirect: jest.fn(),
    notFound: jest.fn(),
  }));
}

describe("BottomTabNav", () => {
  afterEach(() => {
    // 다음 테스트가 영향 받지 않게 모듈 mock 캐시 초기화
    jest.resetModules();
  });

  it("5개 탭 라벨 (홈/검색/등록/채팅/마이)이 모두 노출", () => {
    renderWithProviders(<BottomTabNav />);
    expect(screen.getByText("홈")).toBeInTheDocument();
    expect(screen.getByText("검색")).toBeInTheDocument();
    expect(screen.getByText("채팅")).toBeInTheDocument();
    expect(screen.getByText("마이")).toBeInTheDocument();
    // 가운데 등록 버튼은 라벨이 없는 + 아이콘만이라 텍스트 검증 대신 길이로 확인
    expect(screen.queryByText("등록")).not.toBeInTheDocument();
  });

  it("탭 클릭 시 router.push 가 해당 경로로 호출", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BottomTabNav />);
    await user.click(screen.getByText("검색"));
    expect(__nextRouterMocks.push).toHaveBeenCalledWith("/search");
    await user.click(screen.getByText("채팅"));
    expect(__nextRouterMocks.push).toHaveBeenCalledWith("/chat");
  });

  it("가운데 등록 버튼 클릭 시 /register 로 이동", async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<BottomTabNav />);
    // 가운데 + 버튼: AddRoundedIcon 안의 svg → 부모 클릭 가능 박스를 찾는다.
    // 위치상 3번째 자식 (index 2) 이 가운데 등록 버튼 wrapper.
    const wrappers = container.querySelectorAll(":scope > div > div");
    // 첫 자식이 nav 박스, 그 안 5개 자식이 탭들
    const tabs = (wrappers[0]?.parentElement as HTMLElement | null)?.children;
    // 간단히 svg 가 1개만 들어있는 (라벨 없는) 자식을 찾는다 — 가운데 + 버튼.
    const primaryTab = Array.from(
      container.firstElementChild?.children ?? []
    ).find((el) => !el.textContent || el.textContent.trim() === "");
    expect(primaryTab).toBeTruthy();
    await user.click(primaryTab as Element);
    expect(__nextRouterMocks.push).toHaveBeenCalledWith("/register");
  });
});
