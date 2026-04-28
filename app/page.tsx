"use client";

// 스플래시/온보딩 화면 ("/") — 최초 진입 시 앱 소개 + 시작 진입점 제공
// TODO: 카카오/네이버/Apple OAuth 미연결. 현재 로그인 페이지로 이동만 함
//
// 로그인 진입 동작:
// - 이미 로그인된 사용자는 middleware 가 /login → /home 으로 자동 리다이렉트한다.
// - 그래서 사용자가 스플래시에서 "이메일/카카오로 시작하기" 를 눌렀을 때,
//   "다시 로그인하려는 의도" 를 존중하기 위해 기존 세션을 먼저 로그아웃 후 /login 으로 보낸다.
// - "로그인 없이 둘러보기" 는 세션 유지 — 이미 로그인 상태라면 그대로 둠.

import { Box, Button, Stack, Typography } from "@mui/material";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { palette } from "@/lib/theme";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function SplashPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [navigating, setNavigating] = useState(false);

  // 로그인 화면으로 이동 — 이미 로그인된 경우 먼저 로그아웃해 자동 리다이렉트(/login → /home)를 우회
  const goLogin = async () => {
    if (navigating) return;
    setNavigating(true);
    try {
      if (user) await signOut();
      router.push("/login");
    } catch {
      // signOut 이 실패해도 사용자가 시도할 수 있도록 /login 으로 시도
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
            onClick={goLogin}
            disabled={navigating}
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
            onClick={goLogin}
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
            이메일로 시작하기
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
