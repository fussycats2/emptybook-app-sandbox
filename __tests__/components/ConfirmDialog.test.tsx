// ConfirmDialog — open/close, 확인/취소 콜백 분기, 커스텀 라벨.

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { renderWithProviders } from "../test-utils";

describe("ConfirmDialog", () => {
  it("open=false 면 내용 노출 안 됨", () => {
    renderWithProviders(
      <ConfirmDialog
        open={false}
        title="삭제할까요?"
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
      />
    );
    expect(screen.queryByText("삭제할까요?")).not.toBeInTheDocument();
  });

  it("open=true 면 title + 기본 라벨(확인/취소) 노출", () => {
    renderWithProviders(
      <ConfirmDialog
        open
        title="삭제할까요?"
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
      />
    );
    expect(screen.getByText("삭제할까요?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "확인" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "취소" })).toBeInTheDocument();
  });

  it("description 도 같이 표시", () => {
    renderWithProviders(
      <ConfirmDialog
        open
        title="t"
        description="이 작업은 되돌릴 수 없어요"
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
      />
    );
    expect(
      screen.getByText("이 작업은 되돌릴 수 없어요")
    ).toBeInTheDocument();
  });

  it("확인/취소 버튼 클릭 시 각 콜백만 호출", async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    renderWithProviders(
      <ConfirmDialog
        open
        title="t"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    await user.click(screen.getByRole("button", { name: "확인" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("커스텀 라벨 적용 (destructive 표시 등)", () => {
    renderWithProviders(
      <ConfirmDialog
        open
        title="t"
        confirmLabel="영구 삭제"
        cancelLabel="아니요"
        destructive
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
      />
    );
    expect(
      screen.getByRole("button", { name: "영구 삭제" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "아니요" })
    ).toBeInTheDocument();
  });
});
