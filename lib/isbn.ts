// ISBN 검증/정규화 헬퍼
// - 바코드 스캐너에서 읽힌 EAN-13 / ISBN-10 문자열을 검증해서 네이버 검색 API 로 보낼 수 있는 ISBN-13 으로 정리
// - EAN-13 의 도서 prefix 는 978/979 로 한정 (그 외 prefix 는 도서가 아님)

// 입력에서 하이픈/공백 제거 후 숫자/X 만 남김
function clean(raw: string): string {
  return raw.replace(/[\s-]/g, "").toUpperCase();
}

// ISBN-10 체크섬: sum(digit * (10-i)) mod 11 == 0, 마지막 자리는 X(=10) 가능
export function isValidIsbn10(raw: string): boolean {
  const s = clean(raw);
  if (!/^\d{9}[\dX]$/.test(s)) return false;
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const ch = s[i];
    const d = ch === "X" ? 10 : parseInt(ch, 10);
    sum += d * (10 - i);
  }
  return sum % 11 === 0;
}

// ISBN-13 체크섬: sum(digit * weight[1,3,1,3,...]) mod 10 == 0
export function isValidIsbn13(raw: string): boolean {
  const s = clean(raw);
  if (!/^\d{13}$/.test(s)) return false;
  // 도서 EAN prefix 는 978 또는 979 — 다른 prefix 는 도서가 아니므로 사전 컷
  if (!s.startsWith("978") && !s.startsWith("979")) return false;
  let sum = 0;
  for (let i = 0; i < 13; i++) {
    const d = parseInt(s[i], 10);
    sum += i % 2 === 0 ? d : d * 3;
  }
  return sum % 10 === 0;
}

// ISBN-10 → ISBN-13 변환 (978 prefix 부착 + 체크섬 재계산)
function isbn10To13(raw: string): string {
  const s = clean(raw).slice(0, 9);
  const body = `978${s}`;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const d = parseInt(body[i], 10);
    sum += i % 2 === 0 ? d : d * 3;
  }
  const check = (10 - (sum % 10)) % 10;
  return `${body}${check}`;
}

// 스캐너/사용자 입력 → 정규화된 ISBN-13. 유효하지 않으면 null.
export function normalizeIsbn(raw: string): string | null {
  const s = clean(raw);
  if (isValidIsbn13(s)) return s;
  if (isValidIsbn10(s)) return isbn10To13(s);
  return null;
}
