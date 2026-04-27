"use client";

// 스플래시/온보딩 화면 ("/") — 최초 진입 시 앱 소개 + 시작 진입점 제공
// TODO: 카카오/네이버/Apple OAuth 미연결. 현재 로그인 페이지로 이동만 함

import { Box, Button, Stack, Typography } from "@mui/material";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { useRouter } from "next/navigation";
import { palette } from "@/lib/theme";

export default function SplashPage() {
  const router = useRouter();
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
            onClick={() => router.push("/login")}
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
            onClick={() => router.push("/login")}
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
