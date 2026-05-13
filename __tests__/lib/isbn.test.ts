// ISBN 헬퍼 (lib/isbn.ts) — 체크섬과 정규화 회귀 보호.
// 실제 출판 서적 ISBN 으로 검증해서 알고리즘 + 케이스 둘 다 잡힌다.

import { isValidIsbn10, isValidIsbn13, normalizeIsbn } from "@/lib/isbn";

describe("isValidIsbn13", () => {
  it("실제 도서 EAN-13 (978 prefix)을 유효로 판단", () => {
    // 코스모스 (사이언스북스, 2006) — 실재 ISBN-13
    expect(isValidIsbn13("9788983711892")).toBe(true);
  });

  it("하이픈/공백 포함 입력도 정상 검증", () => {
    expect(isValidIsbn13("978-89-8371-189-2")).toBe(true);
    expect(isValidIsbn13(" 978 8983711892 ")).toBe(true);
  });

  it("978/979 가 아닌 EAN prefix 는 도서가 아니므로 거부", () => {
    // 980… prefix — 도서 아님
    expect(isValidIsbn13("9803711892008")).toBe(false);
  });

  it("체크섬이 틀린 13자리는 거부", () => {
    // 마지막 자리만 임의로 바꿈
    expect(isValidIsbn13("9788983711899")).toBe(false);
  });

  it("길이가 13이 아니면 거부", () => {
    expect(isValidIsbn13("978898371189")).toBe(false);
    expect(isValidIsbn13("97889837118921")).toBe(false);
    expect(isValidIsbn13("")).toBe(false);
  });
});

describe("isValidIsbn10", () => {
  it("실제 도서 ISBN-10 을 유효로 판단", () => {
    // 코스모스 ISBN-10
    expect(isValidIsbn10("8983711892")).toBe(true);
  });

  it("마지막 자리 X 도 허용 (체크 digit 10)", () => {
    // 잘 알려진 예: 0306406152 (체크섬 2) → 변형해서 X 형태 검증
    // "043942089X" — 해리포터 1권 ISBN-10
    expect(isValidIsbn10("043942089X")).toBe(true);
  });

  it("하이픈 포함 / 소문자 x 도 정상 검증", () => {
    expect(isValidIsbn10("0-439-42089-X")).toBe(true);
    expect(isValidIsbn10("043942089x")).toBe(true);
  });

  it("체크섬이 틀린 10자리는 거부", () => {
    expect(isValidIsbn10("8983711893")).toBe(false);
  });
});

describe("normalizeIsbn", () => {
  it("유효한 ISBN-13 은 정규화된 13자리 그대로 반환", () => {
    expect(normalizeIsbn("978-89-8371-189-2")).toBe("9788983711892");
  });

  it("ISBN-10 입력은 978 prefix 가 붙은 ISBN-13 으로 변환", () => {
    // 8983711892 → 9788983711892
    expect(normalizeIsbn("8983711892")).toBe("9788983711892");
  });

  it("유효하지 않은 입력은 null", () => {
    expect(normalizeIsbn("hello")).toBeNull();
    expect(normalizeIsbn("1234567890")).toBeNull();
    expect(normalizeIsbn("")).toBeNull();
  });
});
