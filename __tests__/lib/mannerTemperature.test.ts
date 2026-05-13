// 매너온도 계산 (components/ui/MannerTemperature.tsx).
// 단일 출처 헬퍼 — SellerCard / 마이페이지 본인 카드가 같은 식을 공유.

import { calcMannerTemperature } from "@/components/ui/MannerTemperature";

describe("calcMannerTemperature", () => {
  it("거래 0회 + 후기 없음 → 36.5℃ (체온 베이스)", () => {
    expect(calcMannerTemperature(0, undefined)).toBe(36.5);
    expect(calcMannerTemperature(null, null)).toBe(36.5);
  });

  it("거래 50회 + 별점 5.0 → 46.0℃ (max)", () => {
    expect(calcMannerTemperature(50, 5)).toBe(46.0);
  });

  it("거래 12회 + 별점 4.5 → 39.8℃ (문서화된 예시)", () => {
    expect(calcMannerTemperature(12, 4.5)).toBe(39.8);
  });

  it("거래 회수는 50에서 캡 — 100회여도 50회와 같은 trade bonus", () => {
    const at50 = calcMannerTemperature(50, 0);
    const at100 = calcMannerTemperature(100, 0);
    expect(at100).toBe(at50);
  });

  it("별점 3.0 이하는 ratingBonus 0", () => {
    expect(calcMannerTemperature(0, 2)).toBe(36.5);
    expect(calcMannerTemperature(0, 3)).toBe(36.5);
  });

  it("음수 거래 회수는 0으로 클램프", () => {
    expect(calcMannerTemperature(-5, 0)).toBe(36.5);
  });

  it("결과는 소수점 첫째 자리까지 (toFixed 1)", () => {
    const v = calcMannerTemperature(7, 4.2);
    // 정수가 아닌 한 자릿수 소수
    expect(v.toString()).toMatch(/^\d+(\.\d)?$/);
  });
});
