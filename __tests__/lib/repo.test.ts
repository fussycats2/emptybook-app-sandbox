// lib/repo.ts 의 순수 헬퍼 — bookStatusToUI / isUuid / anonymizeName.
// repo.ts 전체를 import 하지만 Supabase client 는 dynamic import 라
// 함수 호출 없이는 네트워크/auth 코드가 실행되지 않는다.

import { bookStatusToUI, isUuid, anonymizeName } from "@/lib/repo";

describe("bookStatusToUI", () => {
  it("HIDDEN 은 무료나눔이라도 'canceled' 우선", () => {
    expect(bookStatusToUI("HIDDEN", { free: true })).toBe("canceled");
    expect(bookStatusToUI("HIDDEN")).toBe("canceled");
  });

  it("free 플래그가 있으면 'free' (HIDDEN 외 모든 상태에서)", () => {
    expect(bookStatusToUI("SELLING", { free: true })).toBe("free");
    expect(bookStatusToUI("RESERVED", { free: true })).toBe("free");
    expect(bookStatusToUI("SOLD", { free: true })).toBe("free");
  });

  it("RESERVED → 'reserved'", () => {
    expect(bookStatusToUI("RESERVED")).toBe("reserved");
  });

  it("SOLD → 'sold'", () => {
    expect(bookStatusToUI("SOLD")).toBe("sold");
  });

  it("SELLING → 'selling' (기본값)", () => {
    expect(bookStatusToUI("SELLING")).toBe("selling");
  });
});

describe("isUuid", () => {
  it("표준 UUID v4 는 true", () => {
    expect(isUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("UUID 대문자 / 소문자 모두 허용", () => {
    expect(isUuid("550E8400-E29B-41D4-A716-446655440000")).toBe(true);
  });

  it("mock 시드 id (c-1, 1, book-abc) 는 false — mock 라우팅 가드의 핵심", () => {
    expect(isUuid("c-1")).toBe(false);
    expect(isUuid("1")).toBe(false);
    expect(isUuid("book-abc")).toBe(false);
  });

  it("null / undefined / 빈 문자열은 false", () => {
    expect(isUuid(null)).toBe(false);
    expect(isUuid(undefined)).toBe(false);
    expect(isUuid("")).toBe(false);
  });

  it("UUID 형식 비슷하지만 자릿수 다르면 false", () => {
    expect(isUuid("550e8400-e29b-41d4-a716-44665544000")).toBe(false); // 한 자리 부족
    expect(isUuid("550e8400e29b41d4a716446655440000")).toBe(false); // 하이픈 없음
  });
});

describe("anonymizeName", () => {
  it("일반 한글 이름은 첫 글자 + 나머지 *", () => {
    expect(anonymizeName("김민주")).toBe("김**");
    expect(anonymizeName("홍길동")).toBe("홍**");
  });

  it("영문 이름도 같은 규칙", () => {
    expect(anonymizeName("kim")).toBe("k**");
    expect(anonymizeName("Alice")).toBe("A****");
  });

  it("1글자는 마스킹 없이 그대로 (정보 노출 거의 없음)", () => {
    expect(anonymizeName("A")).toBe("A");
    expect(anonymizeName("김")).toBe("김");
  });

  it("빈 문자열 / null / undefined → fallback ('상대방' 기본)", () => {
    expect(anonymizeName("")).toBe("상대방");
    expect(anonymizeName(null)).toBe("상대방");
    expect(anonymizeName(undefined)).toBe("상대방");
  });

  it("커스텀 fallback 지정 가능", () => {
    expect(anonymizeName("", "익명")).toBe("익명");
  });

  it("앞뒤 공백은 trim 후 처리", () => {
    expect(anonymizeName("  김민주  ")).toBe("김**");
    expect(anonymizeName("   ")).toBe("상대방");
  });
});
