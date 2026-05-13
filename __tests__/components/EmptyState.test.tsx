// EmptyState — 빈 화면 안내. title 은 필수, description/action 은 선택.

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EmptyState from "@/components/ui/EmptyState";
import { renderWithProviders } from "../test-utils";

describe("EmptyState", () => {
  it("title 만 넘기면 description / action 은 미노출", () => {
    renderWithProviders(<EmptyState title="아직 찜한 책이 없어요" />);
    expect(screen.getByText("아직 찜한 책이 없어요")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("description 을 같이 노출", () => {
    renderWithProviders(
      <EmptyState
        title="검색 결과가 없어요"
        description="다른 검색어로 시도해 보세요"
      />
    );
    expect(screen.getByText("다른 검색어로 시도해 보세요")).toBeInTheDocument();
  });

  it("actionLabel + onAction 동시 제공 시 버튼 노출 + 클릭 콜백", async () => {
    const user = userEvent.setup();
    const onAction = jest.fn();
    renderWithProviders(
      <EmptyState
        title="목록이 비었어요"
        actionLabel="홈으로"
        onAction={onAction}
      />
    );
    const btn = screen.getByRole("button", { name: "홈으로" });
    await user.click(btn);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("actionLabel 만 있고 onAction 없으면 버튼 미노출 (둘 다 있어야 렌더)", () => {
    renderWithProviders(
      <EmptyState title="x" actionLabel="홈으로" />
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
