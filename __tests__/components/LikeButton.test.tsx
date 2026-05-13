// LikeButton — bookId 없는 디자인 데모 모드만 검증.
// (bookId 모드는 Zustand store + React Query mutation 으로 묶여 있어 통합테스트가 더 적합)

import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LikeButton from "@/components/ui/LikeButton";
import { renderWithProviders } from "../test-utils";

describe("LikeButton (bookId 없는 로컬 모드)", () => {
  it("기본 비찜 상태 — aria-pressed=false, 빈 하트 아이콘", () => {
    renderWithProviders(<LikeButton />);
    const btn = screen.getByRole("button", { name: "like" });
    expect(btn).toHaveAttribute("aria-pressed", "false");
  });

  it("defaultLiked=true 면 시작부터 찜 상태", () => {
    renderWithProviders(<LikeButton defaultLiked />);
    expect(screen.getByRole("button", { name: "like" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("클릭 시 aria-pressed 토글", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LikeButton />);
    const btn = screen.getByRole("button", { name: "like" });
    await user.click(btn);
    expect(btn).toHaveAttribute("aria-pressed", "true");
    await user.click(btn);
    expect(btn).toHaveAttribute("aria-pressed", "false");
  });

  it("onChange 콜백이 토글 결과로 호출", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderWithProviders(<LikeButton onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "like" }));
    expect(onChange).toHaveBeenCalledWith(true);
    await user.click(screen.getByRole("button", { name: "like" }));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("stopPropagation=true (기본) 면 부모 클릭 핸들러로 번지지 않음", () => {
    const parentClick = jest.fn();
    renderWithProviders(
      <div onClick={parentClick}>
        <LikeButton />
      </div>
    );
    fireEvent.click(screen.getByRole("button", { name: "like" }));
    expect(parentClick).not.toHaveBeenCalled();
  });

  it("stopPropagation=false 면 부모로 이벤트 전파", () => {
    const parentClick = jest.fn();
    renderWithProviders(
      <div onClick={parentClick}>
        <LikeButton stopPropagation={false} />
      </div>
    );
    fireEvent.click(screen.getByRole("button", { name: "like" }));
    expect(parentClick).toHaveBeenCalledTimes(1);
  });
});
