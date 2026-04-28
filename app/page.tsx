"use client";

// 스플래시/온보딩 화면 ("/") — 최초 진입 시 앱 소개 + 시작 진입점 제공
//
// 버튼 별 동작:
// - "카카오로 3초 만에 시작하기" → 카카오 OAuth 시도 (현재 미구현 → 토스트 안내). /login 으로 가지 않음
// - "이메일로 로그인" → /login 으로 이동 (이메일 폼이 메인으로 표시되는 화면)
// - "로그인 없이 둘러보기" → /home 으로 게스트 진입
//
// 로그인 진입 시 자동 리다이렉트 우회:
//   middleware 는 이미 로그인된 사용자가 /login 에 가면 /home 으로 보내버림.
//   그래서 스플래시에서 명시적으로 로그인 버튼을 눌렀을 땐 기존 세션을 먼저 로그아웃하여
//   "다시 로그인하려는 의도"가 그대로 살아 있게 한다.

import { Box, Button, Stack, Typography } from "@mui/material";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { palette } from "@/lib/theme";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";

export default function SplashPage() {
  const router = useRouter();
  const toast = useToast();
  const { user, signOut } = useAuth();
  const [navigating, setNavigating] = useState(false);

  // 카카오 OAuth — 아직 연결되지 않아 사용자에게 안내만
  // (구현되면 supabase.auth.signInWithOAuth({ provider: 'kakao' }) 로 교체)
  const goKakao = () => {
    toast?.show("카카오 로그인은 준비 중이에요");
  };

  // 이메일 로그인 화면으로 이동 — 이미 로그인된 경우 먼저 로그아웃해 middleware 자동 리다이렉트를 우회
  const goEmailLogin = async () => {
    if (navigating) return;
    setNavigating(true);
    try {
      if (user) await signOut();
      router.push("/login");
    } catch {
      // signOut 이 실패해도 사용자가 시도할 수 있도록 /login 으로 보낸다
      router.push("/login");
    } finally {
      setNavigating(false);
    }
  };
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: `linear-gradient(180deg, ${palette.primary} 0%, ${palette.primaryDark} 100%)`,
        color: "#fff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 우상단 + 좌하단 모서리 라이트닝 효과를 라디얼 그라데이션 두 개로 만든 레이어 */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 80% 0%, rgba(255,255,255,0.18) 0%, transparent 40%), radial-gradient(circle at 0% 100%, rgba(255,255,255,0.08) 0%, transparent 40%)",
        }}
      />
      <Box
        sx={{
          position: "relative",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          p: 4,
          pt: 9,
        }}
      >
        <Box>
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: 4,
              background: "rgba(255,255,255,0.16)",
              backdropFilter: "blur(8px)",
              display: "grid",
              placeItems: "center",
              mb: 4,
            }}
          >
            <MenuBookRoundedIcon sx={{ fontSize: 38 }} />
          </Box>
          <Typography sx={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.02em" }}>
            책장비움
          </Typography>
          <Typography sx={{ fontSize: 16, opacity: 0.9, mt: 1.5, lineHeight: 1.55 }}>
            내 책장의 책,
            <br />
            이웃에게 다시 흐르게.
          </Typography>
        </Box>

        <Stack gap={1.25} className="safe-bottom">
          <Button
            fullWidth
            onClick={goKakao}
            sx={{
              background: palette.kakao,
              color: palette.kakaoText,
              fontWeight: 800,
              "&:hover": { background: "#FFE000" },
            }}
          >
            카카오로 3초 만에 시작하기
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={goEmailLogin}
            disabled={navigating}
            sx={{
              background: "rgba(255,255,255,0.08)",
              borderColor: "rgba(255,255,255,0.4)",
              color: "#fff",
              "&:hover": {
                background: "rgba(255,255,255,0.16)",
                borderColor: "rgba(255,255,255,0.6)",
              },
            }}
          >
            이메일로 로그인
          </Button>
          <Button
            fullWidth
            variant="text"
            onClick={() => router.push("/home")}
            endIcon={<ArrowForwardRoundedIcon />}
            sx={{ color: "rgba(255,255,255,0.85)", mt: 1 }}
          >
            로그인 없이 둘러보기
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
