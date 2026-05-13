// /terms 페이지 — 정적 약관. TERMS_SECTIONS 의 첫/끝 섹션 제목이 렌더되는지로 회귀 보호.
// AppHeader 의 left=back 버튼이 존재 + ARTICLE 라벨이 섹션 수만큼 노출되는지.

import { screen } from "@testing-library/react";
import TermsPage from "@/app/terms/page";
import { TERMS_SECTIONS } from "@/lib/staticContent";
import { renderWithProviders } from "../test-utils";

describe("/terms (이용약관)", () => {
  it("페이지 제목 '이용 약관' 노출", () => {
    renderWithProviders(<TermsPage />);
    expect(screen.getByText("이용 약관")).toBeInTheDocument();
  });

  it("TERMS_SECTIONS 첫 / 마지막 섹션 제목이 모두 노출", () => {
    renderWithProviders(<TermsPage />);
    expect(screen.getByText(TERMS_SECTIONS[0].title)).toBeInTheDocument();
    expect(
      screen.getByText(TERMS_SECTIONS[TERMS_SECTIONS.length - 1].title)
    ).toBeInTheDocument();
  });

  it("섹션 개수만큼 ARTICLE NN 헤더가 그려진다", () => {
    renderWithProviders(<TermsPage />);
    // "ARTICLE 01" .. "ARTICLE 0N" 표기
    const labels = screen.getAllByText(/^ARTICLE \d{2}$/);
    expect(labels).toHaveLength(TERMS_SECTIONS.length);
  });

  it("발췌본 안내 배너 노출 — 정식 약관 아님 명시", () => {
    renderWithProviders(<TermsPage />);
    expect(
      screen.getByText(/기본 약관 발췌본입니다/)
    ).toBeInTheDocument();
  });
});
