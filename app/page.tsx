"use client";

// 스플래시/온보딩 화면 ("/") — 최초 진입 시 앱 소개 + 시작 진입점 제공
//
// 디자인 방향 (v7)
//   - 떠다니는 책 표지 3장 → 천천히 흐르는 오로라 블롭(라디얼 그라데이션 3장)으로 교체
//     화면이 한결 차분해지고 모바일에서도 가벼움
//   - 디스플레이 타이포그래피는 Pretendard Variable 의 weight 200 ↔ 800 대비를
//     활용해 "책장은 비우고 / 이야기는 잇다" 처럼 단어 단위 리듬 부여
//   - 상단은 브랜드 마크 + BETA 칩으로 정보 위계만 잡고, 시각 무게는 본문에 집중

import { Box, Button, Stack, Typography } from "@mui/material";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function SplashPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [navigating, setNavigating] = useState(false);

  // /login 진입 — 이미 로그인된 경우 먼저 signOut 해 middleware 자동 리다이렉트를 우회
  const goLogin = async () => {
    if (navigating) return;
    setNavigating(true);
    try {
      if (user) await signOut();
      router.push("/login");
    } catch {
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
        background: "#0A1714",
        color: "#FCFAF4",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 오로라 블롭 — 천천히 드리프트하는 라디얼 그라데이션 3장 */}
      <Box className="aurora aurora-1" />
      <Box className="aurora aurora-2" />
      <Box className="aurora aurora-3" />

      {/* 미세 그레인 노이즈 — 평면 그라데이션이 너무 매끈하지 않도록 */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          opacity: 0.16,
          mixBlendMode: "overlay",
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.55) 0.6px, transparent 0.7px)",
          backgroundSize: "3px 3px",
          pointerEvents: "none",
        }}
      />

      {/* 상단 브랜드 바 — 작은 마크 + 워드마크 + BETA */}
      <Stack
        direction="row"
        alignItems="center"
        gap={1.25}
        className="splash-rise"
        sx={{ position: "relative", zIndex: 1, px: 3, pt: 3 }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 2,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.16)",
            backdropFilter: "blur(8px)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <MenuBookRoundedIcon sx={{ fontSize: 18, color: "#E8F1EB" }} />
        </Box>
        <Typography
          sx={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em" }}
        >
          책장비움
        </Typography>
        <Box
          sx={{
            ml: "auto",
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: "0.16em",
            color: "rgba(255,255,255,0.5)",
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: 999,
            px: 1,
            py: 0.3,
          }}
        >
          BETA
        </Box>
      </Stack>

      {/* 본문 */}
      <Box
        sx={{
          position: "relative",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          px: 4,
          pt: 5,
          pb: 4,
        }}
      >
        <Box>
          {/* EYEBROW */}
          <Stack
            direction="row"
            alignItems="center"
            gap={1.25}
            className="splash-rise"
            sx={{ mb: 3 }}
          >
            <Box
              sx={{
                width: 24,
                height: 1,
                background: "rgba(255,255,255,0.45)",
              }}
            />
            <Typography
              sx={{
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: "0.32em",
                color: "rgba(252,250,244,0.7)",
              }}
            >
              EMPTY · YOUR · SHELF
            </Typography>
          </Stack>

          {/* Hero — 무게 대비로 단어별 리듬을 주는 디스플레이 헤드라인
              "책장은(200)  비우고(800)," / "이야기는(200)  잇다(800)."
              420px 카드 폭에서 단어 분리 줄바꿈을 막기 위해 nowrap + 살짝 작은 사이즈 */}
          <Typography
            className="splash-rise"
            sx={{
              fontSize: { xs: 46, sm: 56 },
              fontWeight: 200,
              letterSpacing: "-0.045em",
              lineHeight: 1.06,
              whiteSpace: "nowrap",
              animationDelay: "120ms",
            }}
          >
            책장은{" "}
            <Box
              component="span"
              sx={{ fontWeight: 800, color: "#FCFAF4" }}
            >
              비우고
            </Box>
            ,
          </Typography>
          <Typography
            className="splash-rise"
            sx={{
              fontSize: { xs: 46, sm: 56 },
              fontWeight: 200,
              letterSpacing: "-0.045em",
              lineHeight: 1.06,
              whiteSpace: "nowrap",
              animationDelay: "200ms",
            }}
          >
            이야기는{" "}
            <Box
              component="span"
              sx={{ fontWeight: 800, color: "#FCFAF4" }}
            >
              잇다
            </Box>
            <Box component="span" sx={{ color: "#7CE0B0" }}>
              .
            </Box>
          </Typography>

          {/* 서브카피 — 두 절 구조로 의도된 위치(쉼표 뒤)에서 줄바꿈 */}
          <Typography
            className="splash-rise"
            sx={{
              fontSize: 14.5,
              fontWeight: 400,
              opacity: 0.72,
              mt: 3,
              lineHeight: 1.65,
              animationDelay: "280ms",
            }}
          >
            당신의 책 한 권이,
            <br />
            누군가의 첫 페이지가 됩니다.
          </Typography>

          {/* 라이브 활동 인디케이터 */}
          <Stack
            className="splash-rise"
            direction="row"
            alignItems="center"
            gap={1.25}
            sx={{
              mt: 3.5,
              px: 1.5,
              py: 0.85,
              width: "fit-content",
              borderRadius: 999,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(8px)",
              animationDelay: "360ms",
            }}
          >
            <Box
              className="splash-pulse"
              sx={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#7CE0B0",
                boxShadow: "0 0 0 4px rgba(124,224,176,0.18)",
              }}
            />
            <Typography
              sx={{ fontSize: 11.5, fontWeight: 600, opacity: 0.95 }}
            >
              지금 <strong style={{ fontWeight: 800 }}>3,250명</strong>이 책장을
              비우고 있어요
            </Typography>
          </Stack>
        </Box>

        {/* CTA */}
        <Stack
          gap={0.5}
          className="safe-bottom splash-rise"
          sx={{ animationDelay: "440ms" }}
        >
          <Button
            fullWidth
            onClick={goLogin}
            disabled={navigating}
            endIcon={<ArrowForwardRoundedIcon />}
            sx={{
              background: "#FCFAF4",
              color: "#0A1714",
              fontWeight: 800,
              minHeight: 56,
              fontSize: 15,
              borderRadius: 999,
              boxShadow: "0 14px 40px rgba(0,0,0,0.32)",
              transition: "transform 140ms ease, background 140ms ease",
              "&:hover": { background: "#fff", transform: "translateY(-1px)" },
              "&.Mui-disabled": {
                background: "rgba(252,250,244,0.6)",
                color: "#0A1714",
              },
            }}
          >
            시작하기
          </Button>
          <Button
            fullWidth
            variant="text"
            onClick={() => router.push("/home")}
            sx={{
              color: "rgba(252,250,244,0.7)",
              minHeight: 48,
              fontWeight: 600,
              borderRadius: 999,
              "&:hover": {
                background: "rgba(255,255,255,0.06)",
                color: "#fff",
              },
            }}
          >
            로그인 없이 둘러보기
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
