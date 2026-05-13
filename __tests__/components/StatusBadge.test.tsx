// StatusBadge — 도서 상태별 라벨이 단일 MAP 에서 파생.
// MAP 의 라벨이 바뀌면 다른 화면 컨벤션이 깨지므로 회귀 보호.

import { screen } from "@testing-library/react";
import StatusBadge from "@/components/ui/StatusBadge";
import { renderWithProviders } from "../test-utils";

describe("StatusBadge", () => {
  it.each([
    ["selling", "판매중"],
    ["reserved", "예약중"],
    ["sold", "거래완료"],
    ["free", "무료나눔"],
    ["canceled", "취소"],
  ] as const)("status=%s 는 '%s' 라벨", (status, label) => {
    renderWithProviders(<StatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("size sm/md 둘 다 라벨 노출은 동일", () => {
    const { rerender } = renderWithProviders(
      <StatusBadge status="selling" size="sm" />
    );
    expect(screen.getByText("판매중")).toBeInTheDocument();
    rerender(<StatusBadge status="selling" size="md" />);
    expect(screen.getByText("판매중")).toBeInTheDocument();
  });
});
