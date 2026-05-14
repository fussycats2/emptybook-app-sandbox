// Supabase Auth 에러 메시지 → 한글 라벨
//
// supabase-js 가 던지는 error.message 는 영어 원문(예: "Invalid login credentials").
// 화면 토스트에 영어가 그대로 노출되던 회귀를 잡기 위해 알려진 패턴을 한글로 매핑한다.
// 매핑되지 않은 메시지는 호출자가 넘긴 fallback(한글) 으로 떨어진다.
//
// 매핑 전략:
//  - 정확 일치 사전(EXACT) — 가장 자주 보이는 케이스
//  - 부분 매칭(SUBSTR) — 메시지에 동적 값(초 단위, 횟수) 가 섞이는 케이스
//  - error.code(=AuthApiError.code) 도 함께 보면 더 단단하지만, 메시지만으로 충분히 잡힘
//
// 추가가 필요한 케이스가 보이면 EXACT 또는 SUBSTR 에 한 줄씩 보강하면 됨.

const EXACT: Record<string, string> = {
  "Invalid login credentials": "이메일 또는 비밀번호가 올바르지 않아요",
  "Email not confirmed": "메일 인증이 아직 안 됐어요. 받은편지함의 인증 메일을 확인해주세요",
  "User already registered": "이미 가입된 이메일이에요. 로그인 해주세요",
  "User not found": "가입되지 않은 이메일이에요",
  "Invalid email or password": "이메일 또는 비밀번호가 올바르지 않아요",
  "Email address is invalid": "이메일 형식이 올바르지 않아요",
  "Unable to validate email address: invalid format":
    "이메일 형식이 올바르지 않아요",
  "Anonymous sign-ins are disabled": "익명 로그인은 사용할 수 없어요",
  "Signups not allowed for this instance":
    "현재 신규 가입이 막혀 있어요. 잠시 후 다시 시도해주세요",
  "Token has expired or is invalid":
    "인증 링크가 만료됐어요. 처음부터 다시 시도해주세요",
};

// 동적 값 섞인 메시지 — 부분 문자열로 매칭
const SUBSTR: { needle: string; ko: string }[] = [
  // ex) "Password should be at least 6 characters."
  {
    needle: "Password should be at least",
    ko: "비밀번호가 너무 짧아요 (6자 이상)",
  },
  // ex) "For security purposes, you can only request this after 23 seconds."
  {
    needle: "For security purposes",
    ko: "보안을 위해 잠시 후 다시 시도해주세요",
  },
  // ex) "Email rate limit exceeded"
  { needle: "rate limit", ko: "요청이 너무 잦아요. 잠시 후 다시 시도해주세요" },
  // ex) "Unable to validate email address: ..."
  {
    needle: "Unable to validate email",
    ko: "이메일 형식이 올바르지 않아요",
  },
  // ex) "Database error saving new user"
  {
    needle: "Database error",
    ko: "서버 처리 중 문제가 생겼어요. 잠시 후 다시 시도해주세요",
  },
  // ex) "captcha verification process failed"
  { needle: "captcha", ko: "보안 검증에 실패했어요. 다시 시도해주세요" },
];

/**
 * Supabase 에러를 한글 메시지로 변환.
 * @param err Supabase 에서 받은 error 객체(또는 message 만 있어도 OK)
 * @param fallback 매핑 실패 시 사용할 한글 폴백
 */
export function translateAuthError(
  err: unknown,
  fallback: string = "요청을 처리하지 못했어요. 잠시 후 다시 시도해주세요"
): string {
  const message =
    err && typeof err === "object" && "message" in err
      ? String((err as { message?: unknown }).message ?? "")
      : typeof err === "string"
      ? err
      : "";
  if (!message) return fallback;
  if (EXACT[message]) return EXACT[message];
  for (const { needle, ko } of SUBSTR) {
    if (message.toLowerCase().includes(needle.toLowerCase())) return ko;
  }
  return fallback;
}
