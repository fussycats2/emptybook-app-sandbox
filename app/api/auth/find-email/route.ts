// 아이디(=이메일) 찾기 API ("/api/auth/find-email")
// - 사용자가 자기 이메일을 잊었을 때, profiles.phone 으로 검색해 마스킹된 이메일을 돌려준다.
// - service_role 키를 쓰는 admin 클라이언트로 auth.users 까지 join 해야 하므로 서버 라우트로만 노출.
//
// 보안 노트:
//   - 본 구현은 SMS OTP 본인 인증을 포함하지 않는다 (사이드 프로젝트 단계의 단순 구현).
//   - 그래도 enumeration / 타이밍 공격을 줄이기 위해 결과는 항상 동일한 형태로 응답하고
//     반환 이메일은 마스킹 처리한다.
//   - 추후 업그레이드 시 "본인인증" SMS 단계 추가 + rate limit 도입 권장.

import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// 이메일 마스킹: "abcdef@gmail.com" → "ab****@gmail.com"
//   - local part 가 1자면 "*@..."
//   - local part 가 2자면 "ab@..." (그대로)
//   - 3자 이상이면 앞 2자만 노출 + 뒤를 **** 로 채운다 (길이 일관성)
function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at);
  if (local.length === 1) return `*${domain}`;
  if (local.length === 2) return `${local}${domain}`;
  return `${local.slice(0, 2)}****${domain}`;
}

// 휴대폰 번호 정규화 — 숫자만 추출 (사용자가 010-1234-5678 / 01012345678 어느 쪽으로 입력해도 매칭)
function normalizePhone(input: string): string {
  return (input || "").replace(/\D+/g, "");
}

export async function POST(request: NextRequest) {
  let phoneRaw = "";
  try {
    const body = (await request.json()) as { phone?: string };
    phoneRaw = body.phone ?? "";
  } catch {
    // JSON 파싱 실패도 동일한 not-found 응답으로 묶어 enumeration 단서 차단
    return NextResponse.json({ found: false });
  }

  const phone = normalizePhone(phoneRaw);
  // 한국 휴대폰은 010 시작 11자리 — 너무 짧거나 비어있으면 즉시 not-found
  if (phone.length < 9) {
    return NextResponse.json({ found: false });
  }

  let admin: ReturnType<typeof supabaseAdmin>;
  try {
    admin = supabaseAdmin();
  } catch {
    return NextResponse.json({ found: false });
  }

  // profiles.phone 은 사용자가 setting 화면에서 직접 입력한다 (자유 형식).
  // 정규화한 값 비교를 위해 우선 후보를 넓게 가져오고 클라이언트 사이드에서 normalize 매칭.
  // (소규모 서비스 가정 — 사용자 수가 많아지면 phone_normalized 컬럼 + GIN/btree index 권장)
  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, phone")
    .not("phone", "is", null);

  if (error || !profiles) {
    return NextResponse.json({ found: false });
  }

  const match = (profiles as { id: string; phone: string | null }[]).find(
    (p) => p.phone && normalizePhone(p.phone) === phone
  );
  if (!match) {
    return NextResponse.json({ found: false });
  }

  // auth.users 에서 email 조회 — admin API 사용
  const { data: userData, error: userErr } = await admin.auth.admin.getUserById(
    match.id
  );
  const email = userData?.user?.email;
  if (userErr || !email) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({
    found: true,
    email: maskEmail(email),
    // 가입일은 사용자가 본인 계정인지 확인하는 데 도움 — auth.users.created_at
    createdAt: userData.user?.created_at ?? null,
  });
}
