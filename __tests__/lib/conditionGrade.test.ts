// 도서 상태 등급 추정 (lib/conditionGrade.ts).
// 등급 캡 규칙(본문 손상 > 외관 손상 합계) 회귀 보호.

import {
  inferGrade,
  hasAnyChecked,
  emptyConditionDetail,
  flattenChecked,
} from "@/lib/conditionGrade";
import type { ConditionDetail } from "@/lib/supabase/types";

describe("inferGrade", () => {
  it("undefined / 빈 detail 은 '최상'", () => {
    expect(inferGrade(undefined)).toBe("최상");
    expect(inferGrade(emptyConditionDetail())).toBe("최상");
  });

  it("본문 페이지누락 → 무조건 '하'", () => {
    const detail: ConditionDetail = {
      ...emptyConditionDetail(),
      body: { missing: true } as any,
    };
    expect(inferGrade(detail)).toBe("하");
  });

  it("본문 낙서/형광펜/얼룩 → 최대 '중'", () => {
    const detail: ConditionDetail = {
      ...emptyConditionDetail(),
      body: { pen: true } as any,
    };
    expect(inferGrade(detail)).toBe("중");
  });

  it("외관 손상 1~2개 → 최대 '상'", () => {
    const detail: ConditionDetail = {
      ...emptyConditionDetail(),
      cover: { fold: true, scratch: true } as any,
    };
    expect(inferGrade(detail)).toBe("상");
  });

  it("외관 손상 3개 이상 → 최대 '중'", () => {
    const detail: ConditionDetail = {
      ...emptyConditionDetail(),
      cover: { fold: true, scratch: true, discolor: true } as any,
    };
    expect(inferGrade(detail)).toBe("중");
  });

  it("부속품 누락만 체크는 등급에 영향 없음 ('최상' 유지)", () => {
    const detail: ConditionDetail = {
      ...emptyConditionDetail(),
      extras: {
        band_missing: true,
        postcard_missing: true,
        cd_missing: true,
      } as any,
    };
    expect(inferGrade(detail)).toBe("최상");
  });

  it("본문 손상 + 외관 손상 동시 → 더 낮은 쪽 적용 (캡 우선)", () => {
    const detail: ConditionDetail = {
      ...emptyConditionDetail(),
      body: { pen: true } as any, // 중
      cover: { fold: true } as any, // 상 — 더 높음
    };
    // 캡은 항상 낮은 쪽이 이김
    expect(inferGrade(detail)).toBe("중");
  });
});

describe("hasAnyChecked", () => {
  it("undefined / 모두 미체크는 false", () => {
    expect(hasAnyChecked(undefined)).toBe(false);
    expect(hasAnyChecked(emptyConditionDetail())).toBe(false);
  });

  it("아무 카테고리라도 하나 체크되면 true (부속품 포함)", () => {
    const detail: ConditionDetail = {
      ...emptyConditionDetail(),
      extras: { band_missing: true } as any,
    };
    expect(hasAnyChecked(detail)).toBe(true);
  });
});

describe("flattenChecked", () => {
  it("undefined 는 빈 배열", () => {
    expect(flattenChecked(undefined)).toEqual([]);
  });

  it("체크된 카테고리만 그룹으로 노출 — 빈 그룹 제외", () => {
    const detail: ConditionDetail = {
      ...emptyConditionDetail(),
      cover: { scratch: true } as any,
    };
    const groups = flattenChecked(detail);
    expect(groups).toHaveLength(1);
    expect(groups[0].category).toBe("표지");
    expect(groups[0].items).toEqual(["긁힘"]);
  });
});
