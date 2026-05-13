// 도서 텍스트 → 카테고리 추정 (lib/categoryMap.ts).
// 룰의 점수 합산이 깨졌을 때 (예: 새 키워드 추가 후 순서 실수) 잡힌다.

import { inferCategory } from "@/lib/categoryMap";

describe("inferCategory", () => {
  it("빈 문자열은 기본값 '소설'", () => {
    expect(inferCategory("")).toBe("소설");
  });

  it("어떤 카테고리에도 매칭 안 되면 '소설' 폴백", () => {
    expect(inferCategory("그냥 책")).toBe("소설");
  });

  it("만화 키워드 — '만화'/'코믹'/'웹툰'", () => {
    expect(inferCategory("나의 첫 만화책")).toBe("만화");
    expect(inferCategory("Marvel Comic Vol.1")).toBe("만화");
  });

  it("아동 — 그림책/어린이/초등", () => {
    expect(inferCategory("초등 1학년 그림책")).toBe("아동");
  });

  it("경제/경영 — 투자/주식/스타트업", () => {
    expect(inferCategory("처음 만나는 주식 투자")).toBe("경제/경영");
  });

  it("자기계발 — 습관/리더십/마인드", () => {
    expect(inferCategory("아주 작은 습관의 힘")).toBe("자기계발");
  });

  it("역사 — 한국사/조선/세계사", () => {
    expect(inferCategory("조선 왕조 실록 정리")).toBe("역사");
  });

  it("과학 — 우주/양자/코스모스", () => {
    expect(inferCategory("코스모스 — 우주의 시작")).toBe("과학");
  });

  it("에세이 — 산문/일기/수필", () => {
    expect(inferCategory("어느 산문 시인의 일기")).toBe("에세이");
  });

  it("동점 시 RULES 배열 앞쪽(더 좁은 카테고리) 우선", () => {
    // '경제 + 역사' 둘 다 1점 → RULES 에서 경제가 더 앞 → 경제/경영
    expect(inferCategory("경제 역사")).toBe("경제/경영");
  });
});
