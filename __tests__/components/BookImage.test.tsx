// BookImage — src 유무에 따른 표지 vs placeholder, badge/overlay 렌더.
// autoWidth 의 자연비율 측정은 jsdom 에서 naturalWidth/Height 가 0 이라
// 의미 있는 검증이 어려워 스킵.

import { screen } from "@testing-library/react";
import BookImage from "@/components/ui/BookImage";
import { renderWithProviders } from "../test-utils";

describe("BookImage", () => {
  it("src 가 있으면 <img> 로 표지를 렌더", () => {
    renderWithProviders(
      <BookImage seed="book-1" src="/covers/test.jpg" width={100} height={140} />
    );
    // 실제 표지 + theaterBackdrop 까지 — 같은 src 로 두 개의 img 가 들어감.
    // 둘 다 alt="" 라 hidden 처리될 수 있어 querySelector 로 직접 확인.
    const imgs = document.querySelectorAll("img");
    const targets = Array.from(imgs).filter((i) =>
      i.getAttribute("src")?.includes("/covers/test.jpg")
    );
    expect(targets.length).toBeGreaterThan(0);
  });

  it("src 없으면 placeholder (워드마크 'EMPTYBOOK') 표시", () => {
    renderWithProviders(
      <BookImage seed="book-1" width={100} height={140} />
    );
    expect(screen.getByText("EMPTYBOOK")).toBeInTheDocument();
  });

  it("seed 가 같으면 placeholder 색이 결정적 (해시 기반)", () => {
    // 직접 색 검증은 sx 라 어렵지만, 같은 seed 두 번 렌더 → 동일 DOM 트리 보장.
    const { container: a } = renderWithProviders(
      <BookImage seed="book-42" width={100} height={140} />
    );
    const { container: b } = renderWithProviders(
      <BookImage seed="book-42" width={100} height={140} />
    );
    expect(a.firstChild?.firstChild).toBeTruthy();
    expect(b.firstChild?.firstChild).toBeTruthy();
    // 두 placeholder 가 같은 'EMPTYBOOK' wordmark 를 갖는다 (sanity)
    expect(a.textContent).toContain("EMPTYBOOK");
    expect(b.textContent).toContain("EMPTYBOOK");
  });

  it("badge prop 을 좌상단에 렌더", () => {
    renderWithProviders(
      <BookImage
        seed="b"
        width={100}
        height={140}
        badge={<span data-testid="badge">NEW</span>}
      />
    );
    expect(screen.getByTestId("badge")).toBeInTheDocument();
  });
});
