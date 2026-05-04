// 네이버 OAuth 콜백 ("/api/auth/naver/callback")
// 흐름:
//   1) 쿠키의 state 와 query state 가 일치하는지 검증 (CSRF 방어)
//   2) code 로 access_token 교환 (https://nid.naver.com/oauth2.0/token)
//   3) access_token 으로 사용자 프로필 조회 (https://openapi.naver.com/v1/nid/me)
//   4) Supabase admin 으로 createUser(idempotent) — 이미 있으면 무시
//   5) admin.generateLink({ type: "magiclink" }) 로 hashed_token 발급
//   6) 서버에서 직접 verifyOtp({ token_hash, type:"magiclink" }) → 세션 쿠키를 NextResponse 에 심고 next 로 redirect
//
// 주의:
//   - 초기 구현은 generateLink 가 만들어주는 action_link 로 redirect 했지만,
//     Supabase verify 엔드포인트는 magic link 검증 시 토큰을 URL hash(`#access_token=...`) 로 돌려줘
//     서버 라우트에서는 절대 보이지 않는다. 그래서 action_link hop 자체를 없애고
//     hashed_token 을 같은 요청 안에서 곧바로 verify 한다.
//   - service_role 키를 쓰는 admin 클라이언트는 절대 클라이언트로 노출되면 안 된다.

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabase/admin";

const STATE_COOKIE = "naver_oauth_state";
const NEXT_COOKIE = "naver_oauth_next";

// 어느 단계에서 실패했는지 한눈에 알 수 있는 reason 코드
type FailReason =
  | "state" // CSRF state 불일치 또는 누락
  | "config" // NAVER_OAUTH_CLIENT_ID/SECRET 미설정
  | "supabase_config" // NEXT_PUBLIC_SUPABASE_URL/ANON_KEY 미설정
  | "service_role" // SUPABASE_SERVICE_ROLE_KEY 미설정 등 admin 클라이언트 초기화 실패
  | "token" // 네이버 token endpoint 호출 실패
  | "profile" // /v1/nid/me 호출 실패
  | "create" // supabase admin.createUser 가 already* 외 에러
  | "link" // supabase admin.generateLink 실패
  | "verify"; // verifyOtp 실패 — token_hash 만료/위조 등

function failResponse(request: NextRequest, reason: FailReason, detail?: unknown) {
  // production 에서도 보이도록 console.error — 민감 정보(token/secret)는 제외
  console.error(`[naver-oauth] failed at step="${reason}"`, detail ?? "");
  const url = new URL("/login", request.url);
  url.searchParams.set("error", "oauth");
  url.searchParams.set("provider", "naver");
  url.searchParams.set("reason", reason);
  const res = NextResponse.redirect(url);
  res.cookies.delete(STATE_COOKIE);
  res.cookies.delete(NEXT_COOKIE);
  return res;
}

type NaverTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type NaverProfileResponse = {
  resultcode?: string;
  message?: string;
  response?: {
    id?: string;
    email?: string;
    name?: string;
    nickname?: string;
    profile_image?: string;
  };
};

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = request.cookies.get(STATE_COOKIE)?.value;
  const next = request.cookies.get(NEXT_COOKIE)?.value || "/home";
  const safeNext =
    next.startsWith("/") && !next.startsWith("//") ? next : "/home";

  // 1) CSRF 검증
  if (!code || !state || !cookieState || state !== cookieState) {
    return failResponse(request, "state", {
      hasCode: !!code,
      hasState: !!state,
      hasCookieState: !!cookieState,
      match: state === cookieState,
    });
  }

  const clientId = process.env.NAVER_OAUTH_CLIENT_ID;
  const clientSecret = process.env.NAVER_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return failResponse(request, "config");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return failResponse(request, "supabase_config");
  }

  // 2) code → access_token 교환
  const tokenUrl = new URL("https://nid.naver.com/oauth2.0/token");
  tokenUrl.searchParams.set("grant_type", "authorization_code");
  tokenUrl.searchParams.set("client_id", clientId);
  tokenUrl.searchParams.set("client_secret", clientSecret);
  tokenUrl.searchParams.set("code", code);
  tokenUrl.searchParams.set("state", state);

  let accessToken: string | undefined;
  try {
    const tokenRes = await fetch(tokenUrl.toString(), { cache: "no-store" });
    const tokenJson = (await tokenRes.json()) as NaverTokenResponse;
    accessToken = tokenJson.access_token;
    if (!accessToken) {
      return failResponse(request, "token", {
        status: tokenRes.status,
        error: tokenJson.error,
        description: tokenJson.error_description,
      });
    }
  } catch (e) {
    return failResponse(request, "token", e);
  }

  // 3) 사용자 프로필 조회
  let profile: NonNullable<NaverProfileResponse["response"]> | undefined;
  try {
    const profileRes = await fetch("https://openapi.naver.com/v1/nid/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    const profileJson = (await profileRes.json()) as NaverProfileResponse;
    if (profileJson.resultcode !== "00" || !profileJson.response) {
      return failResponse(request, "profile", {
        status: profileRes.status,
        resultcode: profileJson.resultcode,
        message: profileJson.message,
      });
    }
    profile = profileJson.response;
  } catch (e) {
    return failResponse(request, "profile", e);
  }

  // 네이버 동의 항목에 따라 email 이 누락될 수 있어 안정적인 합성 이메일을 폴백으로 사용
  const email =
    profile.email && profile.email.includes("@")
      ? profile.email
      : `naver_${profile.id}@naver.users.emptybook.local`;
  const displayName = profile.nickname || profile.name || "네이버 사용자";

  // 4) Supabase 사용자 생성 (idempotent)
  let admin: ReturnType<typeof supabaseAdmin>;
  try {
    admin = supabaseAdmin();
  } catch (e) {
    return failResponse(request, "service_role", e);
  }
  const { error: createErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      provider: "naver",
      naver_id: profile.id,
      name: displayName,
      avatar_url: profile.profile_image,
    },
    app_metadata: { provider: "naver", providers: ["naver"] },
  });
  if (createErr && !/already|registered|exists/i.test(createErr.message)) {
    return failResponse(request, "create", createErr.message);
  }

  // 5) magiclink 발급 — hashed_token 만 사용 (action_link 로 redirect 하지 않음)
  const { data: linkData, error: linkErr } =
    await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
  const tokenHash = linkData?.properties?.hashed_token;
  if (linkErr || !tokenHash) {
    return failResponse(request, "link", {
      message: linkErr?.message,
    });
  }

  // 6) 서버에서 직접 verifyOtp → 세션 쿠키를 NextResponse 에 직접 심는다.
  //    (createServerClient 의 setAll 콜백에서 response.cookies.set 호출)
  let response = NextResponse.redirect(new URL(safeNext, request.url));
  response.cookies.delete(STATE_COOKIE);
  response.cookies.delete(NEXT_COOKIE);

  const ssrClient = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(list: { name: string; value: string; options?: CookieOptions }[]) {
        // 새 response 를 만들어 redirect 정보(Location)와 갱신된 쿠키를 같이 내려보낸다
        const fresh = NextResponse.redirect(new URL(safeNext, request.url));
        // STATE/NEXT 쿠키는 이미 사용 끝 — 다시 정리
        fresh.cookies.delete(STATE_COOKIE);
        fresh.cookies.delete(NEXT_COOKIE);
        list.forEach(({ name, value, options }) =>
          fresh.cookies.set(name, value, options)
        );
        response = fresh;
      },
    },
  });

  const { error: verifyErr } = await ssrClient.auth.verifyOtp({
    type: "magiclink",
    token_hash: tokenHash,
  });
  if (verifyErr) {
    return failResponse(request, "verify", verifyErr.message);
  }

  return response;
}
