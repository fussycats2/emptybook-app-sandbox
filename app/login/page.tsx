"use client";

// 로그인 페이지 (/login)
// - 스플래시에서 "이메일로 로그인" 으로 진입하는 화면이라, 이메일/비밀번호 폼을 메인으로 배치
// - 하단의 "또는 SNS로 로그인" 영역에 카카오/네이버/Apple 버튼을 보조로 둠 (아직 OAuth 미구현 → 토스트)
// - URL의 next 쿼리스트링이 있으면 로그인 후 그 경로로 돌아간다

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
import { Suspense, useState } from "react";
import AppHeader from "@/components/ui/AppHeader";
import { palette } from "@/lib/theme";
import { useToast } from "@/components/ui/ToastProvider";
import { supabaseBrowser } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/repo";

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

  // SNS 로그인은 OAuth 미구현 — 모두 동일한 안내 토스트
  const notReady = (provider: string) =>
    toast?.show(`${provider} 로그인은 준비 중이에요`);

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
            endAdornment={
              <IconButton size="small" onClick={() => setShow((s) => !s)}>
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
            sx={{ mt: 0.5, minHeight: 48 }}
          >
            {submitting ? "로그인 중…" : "로그인"}
          </Button>
          <Stack
            direction="row"
            justifyContent="center"
            gap={2}
            sx={{ fontSize: 12.5, color: palette.inkSubtle, mt: 1 }}
          >
            <span style={{ cursor: "pointer" }}>아이디 찾기</span>
            <span>|</span>
            <span style={{ cursor: "pointer" }}>비밀번호 찾기</span>
            <span>|</span>
            <span
              onClick={() => router.push("/signup")}
              style={{ color: palette.primary, fontWeight: 700, cursor: "pointer" }}
            >
              회원가입
            </span>
          </Stack>
        </Stack>

        <Divider sx={{ my: 3, color: palette.inkSubtle, fontSize: 12 }}>
          또는 SNS로 로그인
        </Divider>

        <Stack gap={1.25}>
          <Button
            fullWidth
            onClick={() => notReady("카카오")}
            sx={{
              background: palette.kakao,
              color: palette.kakaoText,
              fontWeight: 800,
              minHeight: 48,
              "&:hover": { background: "#FFE000" },
            }}
          >
            카카오로 계속하기
          </Button>
          <Button
            fullWidth
            variant="outlined"
            sx={{ minHeight: 48 }}
            onClick={() => notReady("네이버")}
          >
            네이버로 계속하기
          </Button>
          <Button
            fullWidth
            variant="outlined"
            sx={{ minHeight: 48 }}
            onClick={() => notReady("Apple")}
          >
            Apple로 계속하기
          </Button>
        </Stack>
      </Box>
    </>
  );
}
