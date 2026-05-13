// SearchPill — Enter 키 onSubmit + 한글 IME 가드 (조합 중 Enter 무시).

import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchPill from "@/components/ui/SearchPill";
import { renderWithProviders } from "../test-utils";

describe("SearchPill", () => {
  it("placeholder / value 그대로 노출", () => {
    renderWithProviders(
      <SearchPill placeholder="책 제목" defaultValue="" />
    );
    expect(screen.getByPlaceholderText("책 제목")).toBeInTheDocument();
  });

  it("Enter 키에 onSubmit(value) 호출", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    renderWithProviders(
      <SearchPill placeholder="검색" onSubmit={onSubmit} />
    );
    const input = screen.getByPlaceholderText("검색");
    await user.click(input);
    await user.keyboard("코스모스");
    await user.keyboard("{Enter}");
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith("코스모스");
  });

  it("한글 IME 조합 중 Enter 는 무시 (isComposing=true)", () => {
    const onSubmit = jest.fn();
    renderWithProviders(
      <SearchPill placeholder="검색" onSubmit={onSubmit} />
    );
    const input = screen.getByPlaceholderText("검색") as HTMLInputElement;
    // 조합 중 Enter 가 직접 keydown 이벤트로 들어오는 경우 — nativeEvent.isComposing=true
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("Enter 외 키는 onSubmit 미호출", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    renderWithProviders(
      <SearchPill placeholder="검색" onSubmit={onSubmit} />
    );
    await user.click(screen.getByPlaceholderText("검색"));
    await user.keyboard("a");
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
