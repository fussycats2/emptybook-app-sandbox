// BottomTabNav — 5탭 + 가운데 + 등록 버튼.
// perf 리팩터 이후 각 탭은 router.push 가 아니라 next/link <a href> 로 동작.
// jest.setup.ts 가 next/link 를 단순 anchor 로 mock — anchor 의 href 검증으로 충분.

import { screen } from "@testing-library/react";
import BottomTabNav from "@/components/ui/BottomTabNav";
import { renderWithProviders } from "../test-utils";

describe("BottomTabNav", () => {
  it("5개 탭 라벨 (홈/검색/등록/채팅/마이)이 모두 노출 — 등록은 아이콘만이라 라벨 없음", () => {
    renderWithProviders(<BottomTabNav />);
    expect(screen.getByText("홈")).toBeInTheDocument();
    expect(screen.getByText("검색")).toBeInTheDocument();
    expect(screen.getByText("채팅")).toBeInTheDocument();
    expect(screen.getByText("마이")).toBeInTheDocument();
    expect(screen.queryByText("등록")).not.toBeInTheDocument();
  });

  it.each([
    ["홈", "/home"],
    ["검색", "/search"],
    ["채팅", "/chat"],
    ["마이", "/mypage"],
  ])("탭 '%s' 의 부모 anchor href 는 '%s'", (label, href) => {
    renderWithProviders(<BottomTabNav />);
    // Box component={Link} → mock 에서 anchor. 탭 라벨의 closest('a') 가 그 anchor.
    const tabLabel = screen.getByText(label);
    const anchor = tabLabel.closest("a");
    expect(anchor).toBeTruthy();
    expect(anchor).toHaveAttribute("href", href);
  });

  it("가운데 등록 버튼은 /register 로 가는 anchor (label 없이 + 아이콘)", () => {
    const { container } = renderWithProviders(<BottomTabNav />);
    const registerAnchor = container.querySelector('a[href="/register"]');
    expect(registerAnchor).toBeTruthy();
    // 라벨 텍스트가 없는 게 가운데 + 버튼의 시각적 특징
    expect(registerAnchor?.textContent?.trim()).toBe("");
  });
});
