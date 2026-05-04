"use client";

// 로그인 페이지 (/login)
// - 스플래시에서 "이메일로 로그인" 으로 진입하는 화면이라, 이메일/비밀번호 폼을 메인으로 배치
// - 하단의 "또는 SNS로 로그인" 영역에 카카오/네이버/Google 버튼 — 모두 Supabase OAuth 실연동
// - URL의 next 쿼리스트링이 있으면 로그인 후 그 경로로 돌아간다
// - ?error=oauth 로 돌아오면 OAuth 실패 토스트를 띄움

import {
  Box,
  Button,
  Divider,
  IconButton,
  OutlinedInput,
  Stack,
  Typography,
} from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import AppHeader from "@/components/ui/AppHeader";
import { palette } from "@/lib/theme";
import { useToast } from "@/components/ui/ToastProvider";
import { supabaseBrowser } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/repo";
import { FIELD_HEIGHT, INPUT_SX, PRIMARY_BUTTON_SX } from "@/lib/ui/formStyle";

// Supabase 내장 OAuth Provider 키 (Apple/Google/Kakao 등 — Naver 는 미포함이라 별도 처리)
type OAuthProvider = "kakao" | "google";

// 카카오 로그인은 비즈니스 앱 전환이 필요해서 현재는 비활성. 전환 끝나면 false 로 바꾸면 자동 활성화
const KAKAO_DISABLED = true;

// useSearchParams 는 Suspense 경계 안에서만 동작 — 그래서 외부에서 한 번 감싼다
export default function LoginPage() {
  return (
    <Suspense fallback={<AppHeader title="" left="back" bordered={false} />}>
      <LoginPageInner />
    </Suspense>
  );
}

// 실제 화면 본체. Suspense 안쪽에 위치하므로 useSearchParams 사용 가능
function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/home";
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 이메일/비밀번호 로그인 핸들러
  const handleEmailLogin = async () => {
    if (submitting) return; // 더블클릭 방지
    // mock 모드: 인증 없이 다음 페이지로 진입
    if (!isSupabaseConfigured) {
      toast?.show("Supabase 환경변수가 없어 데모 모드로 진입합니다");
      router.push(next);
      return;
    }
    // 클라이언트 측 1차 유효성 검사 (서버에서 한 번 더 검증됨)
    if (!email.includes("@") || pw.length < 6) {
      toast?.show("이메일과 비밀번호를 확인해주세요");
      return;
    }
    setSubmitting(true);
    const { error } = await supabaseBrowser().auth.signInWithPassword({
      email,
      password: pw,
    });
    setSubmitting(false);
    if (error) {
      toast?.show(error.message || "로그인에 실패했어요");
      return;
    }
    // replace: 뒤로가기로 로그인 화면으로 다시 돌아오지 않도록 히스토리 교체
    router.replace(next);
    // refresh: 서버 컴포넌트의 user 정보 동기화를 위해 라우트 캐시 무효화
    router.refresh();
  };

  // 콜백 라우트(/auth/callback or /api/auth/naver/callback)에서 실패해 ?error=oauth 로 돌아온 경우 토스트로 안내
  // - 네이버 커스텀 콜백은 reason= 쿼리에 어느 단계에서 실패했는지 단서를 함께 보낸다
  useEffect(() => {
    if (searchParams.get("error") !== "oauth") return;
    const provider = searchParams.get("provider");
    const reason = searchParams.get("reason");
    const reasonLabel: Record<string, string> = {
      state: "보안 토큰 검증 실패 (CSRF)",
      config: "네이버 OAuth 환경변수 누락",
      supabase_config: "Supabase 환경변수 누락",
      token: "네이버 토큰 교환 실패",
      profile: "네이버 프로필 조회 실패",
      create: "Supabase 사용자 생성 실패",
      link: "매직링크 발급 실패",
      verify: "세션 검증 실패",
      service_role: "service_role 키 누락",
    };
    const head = provider === "naver" ? "네이버 로그인 실패" : "SNS 로그인 실패";
    const tail = reason && reasonLabel[reason] ? ` — ${reasonLabel[reason]}` : "";
    toast?.show(`${head}${tail}`);
    // toast 는 ref 처럼 안정적이므로 마운트 시 1회면 충분
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // SNS 로그인 — Supabase OAuth(PKCE) 흐름 시작
  // 성공 시 외부 IdP 로 redirect → 인증 후 /auth/callback 으로 돌아오면 세션 교환
  const handleOAuth = async (provider: OAuthProvider, displayName: string) => {
    if (!isSupabaseConfigured) {
      toast?.show("Supabase 환경변수가 없어 SNS 로그인을 사용할 수 없어요");
      return;
    }
    // 콜백 후 원래 가려던 경로로 보내기 위해 next 를 redirectTo 쿼리에 실어 보낸다
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", next);
    const { error } = await supabaseBrowser().auth.signInWithOAuth({
      provider,
      options: { redirectTo: callbackUrl.toString() },
    });
    if (error) {
      // 가장 흔한 케이스: Supabase Dashboard 에서 해당 provider 가 비활성
      toast?.show(
        error.message || `${displayName} 로그인을 시작하지 못했어요`
      );
    }
  };

  return (
    <>
      <AppHeader title="" left="back" bordered={false} />
      <Box sx={{ p: 3, pt: 1, display: "flex", flexDirection: "column", flex: 1 }}>
        <Box>
          <Typography
            sx={{
              fontSize: 11.5,
              fontWeight: 800,
              letterSpacing: "0.18em",
              color: palette.primary,
              mb: 1.25,
            }}
          >
            WELCOME BACK
          </Typography>
          <Typography
            sx={{
              fontSize: 26,
              fontWeight: 800,
              lineHeight: 1.3,
              letterSpacing: "-0.02em",
            }}
          >
            다시 오신 걸
            <br />
            환영해요.
          </Typography>
          <Typography sx={{ fontSize: 14, color: palette.inkMute, mt: 1.25 }}>
            이메일과 비밀번호를 입력해주세요.
          </Typography>
        </Box>

        {/* 이메일/비밀번호 폼 — 첫 화면에 곧바로 보이도록 토글 없이 펼쳐둔다 */}
        <Stack gap={1.25} mt={4}>
          <OutlinedInput
            fullWidth
            placeholder="이메일 주소"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={INPUT_SX}
          />
          <OutlinedInput
            fullWidth
            placeholder="비밀번호"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => {
              // 한글 IME 조합 중 Enter 는 무시 (글자 확정용 키)
              if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
              e.preventDefault();
              handleEmailLogin();
            }}
            sx={INPUT_SX}
            endAdornment={
              <IconButton
                size="small"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "비밀번호 숨기기" : "비밀번호 보기"}
                sx={{ color: palette.inkSubtle, mr: -0.5 }}
              >
                {show ? (
                  <VisibilityOffOutlinedIcon fontSize="small" />
                ) : (
                  <VisibilityOutlinedIcon fontSize="small" />
                )}
              </IconButton>
            }
          />
          <Button
            fullWidth
            onClick={handleEmailLogin}
            disabled={submitting}
            sx={{ ...PRIMARY_BUTTON_SX, mt: 1 }}
          >
            {submitting ? "로그인 중…" : "로그인"}
          </Button>
          <Stack
            direction="row"
            justifyContent="center"
            alignItems="center"
            gap={2}
            sx={{ fontSize: 13, color: palette.inkSubtle, mt: 1.5 }}
          >
            <Box
              component="span"
              onClick={() => router.push("/find-account?tab=email")}
              sx={{ cursor: "pointer", "&:hover": { color: palette.ink } }}
            >
              아이디 찾기
            </Box>
            <Box
              component="span"
              sx={{ width: "1px", height: 11, background: palette.line }}
            />
            <Box
              component="span"
              onClick={() => router.push("/find-account?tab=password")}
              sx={{ cursor: "pointer", "&:hover": { color: palette.ink } }}
            >
              비밀번호 찾기
            </Box>
            <Box
              component="span"
              sx={{ width: "1px", height: 11, background: palette.line }}
            />
            <Box
              component="span"
              onClick={() => router.push("/signup")}
              sx={{
                color: palette.primary,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              회원가입
            </Box>
          </Stack>
        </Stack>

        <Divider
          sx={{
            my: 3.5,
            color: palette.inkSubtle,
            fontSize: 11.5,
            letterSpacing: "0.08em",
            "&::before, &::after": { borderColor: palette.line },
          }}
        >
          또는 SNS로 계속하기
        </Divider>

        <Stack gap={1.25}>
          <Button
            fullWidth
            disabled={KAKAO_DISABLED}
            onClick={() => handleOAuth("kakao", "카카오")}
            sx={{
              background: palette.kakao,
              color: palette.kakaoText,
              fontWeight: 800,
              fontSize: 14.5,
              height: FIELD_HEIGHT,
              "&:hover": { background: "#FFE000" },
              "&.Mui-disabled": {
                background: palette.kakao,
                color: palette.kakaoText,
                opacity: 0.55,
              },
            }}
          >
            {KAKAO_DISABLED ? "카카오로 계속하기 (준비 중)" : "카카오로 계속하기"}
          </Button>
          <Button
            fullWidth
            onClick={() => {
              if (!isSupabaseConfigured) {
                toast?.show("Supabase 환경변수가 없어 SNS 로그인을 사용할 수 없어요");
                return;
              }
              // 네이버는 Supabase 내장 Provider 가 아니라 커스텀 라우트로 이동
              const start = new URL(
                "/api/auth/naver/start",
                window.location.origin
              );
              start.searchParams.set("next", next);
              window.location.href = start.toString();
            }}
            sx={{
              background: palette.naver,
              color: palette.naverText,
              fontWeight: 800,
              fontSize: 14.5,
              height: FIELD_HEIGHT,
              "&:hover": { background: "#02B351" },
            }}
          >
            네이버로 계속하기
          </Button>
          <Button
            fullWidth
            onClick={() => handleOAuth("google", "Google")}
            sx={{
              background: palette.google,
              color: palette.googleText,
              fontWeight: 700,
              fontSize: 14.5,
              height: FIELD_HEIGHT,
              border: `1px solid ${palette.googleBorder}`,
              "&:hover": { background: "#F8F9FA", borderColor: palette.googleBorder },
            }}
          >
            Google로 계속하기
          </Button>
        </Stack>
      </Box>
    </>
  );
}
