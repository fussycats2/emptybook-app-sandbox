"use client";

// 스플래시/온보딩 화면 ("/") — 최초 진입 시 앱 소개 + 시작 진입점 제공
//
// 구성
//   1. 풀블리드 그라데이션 배경 + 라이팅 글로우 + 미세한 그리드 노이즈
//   2. 상단: 떠다니는 책 표지 데코 3장 — 각각 SVG 아트워크 (별·잎·아몬드)
//   3. 가운데: 글로우링 로고 + EYEBROW 키커 + 큰 타이틀 + 서브카피
//   4. 활동 지표(소셜 프루프) 칩
//   5. 하단: 이메일/카카오/게스트 진입 CTA 3종
//
// 외부 이미지 대신 SVG 아트워크를 쓴 이유
//   - 외부 표지 이미지를 가져오면 CORS/저작권/캐시 문제, 첫 페인트가 느려짐
//   - 인라인 SVG 는 즉시 페인트되고 모든 디스플레이에서 선명, 톤도 팔레트와 자연스럽게 일치

import { Box, Button, Stack, Typography } from "@mui/material";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { palette } from "@/lib/theme";
import { useAuth } from "@/lib/auth/AuthProvider";

// --- 책 표지 데코 ----------------------------------------------------------
// 각 표지는 같은 외형(96×128, 라운드, 광택 슬라이드, 살짝 회전 + 부유)을 공유하고
// 내부의 SVG 아트워크와 색감만 책 별로 다르게 둔다.

type CoverDef = {
  key: string;
  title: string;
  sub: string;
  // 표지 색상
  bg: string; // 배경 그라데이션 시작
  bg2: string; // 배경 그라데이션 끝
  fg: string; // 글자/장식 색
  // 배치
  top: number | string;
  left: number | string;
  rot: number;
  delay: number;
  z: number;
  art: "cosmos" | "leaf" | "almond";
};

const COVERS: CoverDef[] = [
  {
    key: "leaf",
    title: "채식주의자",
    sub: "한강",
    bg: "#EDF3EE",
    bg2: "#D6E4DA",
    fg: "#244F3D",
    top: 18,
    left: 14,
    rot: -10,
    delay: 0,
    z: 1,
    art: "leaf",
  },
  {
    key: "cosmos",
    title: "코스모스",
    sub: "칼 세이건",
    bg: "#1A2F4A",
    bg2: "#0E1B2D",
    fg: "#E9D9A8",
    top: 4,
    left: "44%",
    rot: 6,
    delay: 1.2,
    z: 3,
    art: "cosmos",
  },
  {
    key: "almond",
    title: "아몬드",
    sub: "손원평",
    bg: "#F2D8C8",
    bg2: "#E0B49B",
    fg: "#7A2E1E",
    top: 28,
    left: "68%",
    rot: 14,
    delay: 0.6,
    z: 2,
    art: "almond",
  },
];

// 책별 SVG 아트워크 — 96×128 표지 안에 들어갈 일러스트
function CoverArt({ kind, color }: { kind: CoverDef["art"]; color: string }) {
  if (kind === "cosmos") {
    // 우주 — 큰 행성(고리) + 작은 별 점들
    return (
      <svg viewBox="0 0 96 64" width="100%" height="64" aria-hidden>
        <g fill={color} opacity="0.95">
          <circle cx="62" cy="32" r="14" fill="none" stroke={color} strokeWidth="1.2" />
          <ellipse
            cx="62"
            cy="32"
            rx="22"
            ry="6"
            fill="none"
            stroke={color}
            strokeWidth="1"
            opacity="0.55"
            transform="rotate(-18 62 32)"
          />
          <circle cx="62" cy="32" r="6" />
          <circle cx="14" cy="14" r="1.4" />
          <circle cx="26" cy="40" r="1" />
          <circle cx="36" cy="20" r="1.3" />
          <circle cx="20" cy="30" r="0.8" />
          <circle cx="44" cy="50" r="1" />
        </g>
      </svg>
    );
  }
  if (kind === "leaf") {
    // 잎 — 길고 부드러운 잎사귀 + 잎맥
    return (
      <svg viewBox="0 0 96 64" width="100%" height="64" aria-hidden>
        <g stroke={color} strokeLinecap="round" fill="none">
          <path
            d="M14 56 C 22 28, 48 14, 82 8"
            strokeWidth="1.4"
            opacity="0.55"
          />
          <path
            d="M24 52 C 30 30, 50 18, 78 14
               L 82 8
               L 76 22
               C 60 26, 44 36, 32 50 Z"
            fill={color}
            fillOpacity="0.18"
            strokeWidth="1.3"
          />
          <path d="M40 38 C 46 36, 54 30, 64 22" strokeWidth="0.9" opacity="0.6" />
          <path d="M34 46 C 40 44, 50 38, 60 30" strokeWidth="0.9" opacity="0.5" />
        </g>
      </svg>
    );
  }
  // almond — 가운데 큰 아몬드 형태(눈/씨앗) + 동심선
  return (
    <svg viewBox="0 0 96 64" width="100%" height="64" aria-hidden>
      <g stroke={color} fill="none" strokeWidth="1.3">
        <ellipse cx="48" cy="32" rx="22" ry="14" fill={color} fillOpacity="0.18" />
        <ellipse cx="48" cy="32" rx="14" ry="9" />
        <circle cx="48" cy="32" r="4" fill={color} />
        <path d="M14 32 Q 30 18, 48 18" opacity="0.4" />
        <path d="M82 32 Q 66 46, 48 46" opacity="0.4" />
      </g>
    </svg>
  );
}

function FloatingCover({ def }: { def: CoverDef }) {
  // 라운드 값을 한 곳에 묶어 둠 — borderRadius / clipPath 가 같은 값을 써야 새지 않음
  const RADIUS = 8;
  return (
    <Box
      className="splash-float"
      sx={{
        position: "absolute",
        top: def.top,
        left: def.left,
        width: 96,
        height: 128,
        borderRadius: `${RADIUS}px`,
        background: `linear-gradient(160deg, ${def.bg} 0%, ${def.bg2} 100%)`,
        color: def.fg,
        boxShadow:
          "0 22px 48px rgba(0,0,0,0.32), inset 0 0 0 1px rgba(255,255,255,0.45)",
        padding: "10px 10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
        transform: `rotate(${def.rot}deg)`,
        animationDelay: `${def.delay}s`,
        zIndex: def.z,
        ["--rot" as any]: `${def.rot}deg`,
        // overflow:hidden 만으로는 부모가 rotate 된 상태에서 자식 transform(skew)이
        // 일부 브라우저에서 라운드 경계를 뚫고 보이는 이슈가 있어 clipPath 로 강제 클리핑
        overflow: "hidden",
        clipPath: `inset(0 round ${RADIUS}px)`,
      }}
    >
      {/* 좌측 1px 책등 — 진짜 책 같은 디테일 */}
      <Box
        sx={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.06) 100%)",
        }}
      />
      <CoverArt kind={def.art} color={def.fg} />
      <Box sx={{ mt: "auto" }}>
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: "-0.015em",
            color: def.fg,
          }}
        >
          {def.title}
        </Typography>
        <Box
          sx={{
            width: 18,
            height: 1.5,
            background: def.fg,
            opacity: 0.55,
            my: 0.5,
            borderRadius: 1,
          }}
        />
        <Typography
          sx={{ fontSize: 9.5, color: def.fg, opacity: 0.7, fontWeight: 600 }}
        >
          {def.sub}
        </Typography>
      </Box>

      {/* 표지 위 광택 — 무한 shimmer */}
      <Box
        className="splash-shimmer"
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "55%",
          height: "100%",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)",
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />
    </Box>
  );
}

// --- 페이지 ----------------------------------------------------------------

export default function SplashPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [navigating, setNavigating] = useState(false);

  // /login 으로 이동 — 이메일/네이버/구글/카카오 4종을 한 화면에서 선택
  // 이미 로그인된 경우 먼저 로그아웃해 middleware 자동 리다이렉트를 우회
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
        background: `linear-gradient(170deg, ${palette.primary} 0%, ${palette.primaryDark} 55%, #11302A 100%)`,
        color: "#fff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 배경 글로우 */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(60% 40% at 88% 8%, rgba(255,255,255,0.20) 0%, transparent 60%), radial-gradient(50% 35% at 4% 95%, rgba(255,255,255,0.10) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />

      {/* 도트 그리드 노이즈 */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          opacity: 0.4,
          mixBlendMode: "overlay",
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage:
            "radial-gradient(ellipse at 50% 30%, #000 30%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* 상단 떠다니는 책 표지 데코 */}
      <Box
        sx={{
          position: "absolute",
          top: 56,
          left: 0,
          right: 0,
          height: 240,
          pointerEvents: "none",
        }}
      >
        {COVERS.map((c) => (
          <FloatingCover key={c.key} def={c} />
        ))}
      </Box>

      {/* 본문 */}
      <Box
        sx={{
          position: "relative",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          p: 4,
          pt: "300px",
        }}
      >
        <Box>
          {/* 로고 글로우 + 박스 */}
          <Box
            className="splash-rise"
            sx={{ position: "relative", width: 64, height: 64, mb: 3 }}
          >
            <Box
              className="splash-glow"
              sx={{
                position: "absolute",
                inset: -22,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 65%)",
                pointerEvents: "none",
              }}
            />
            <Box
              sx={{
                position: "relative",
                width: 64,
                height: 64,
                borderRadius: 3,
                background: "rgba(255,255,255,0.16)",
                border: "1px solid rgba(255,255,255,0.22)",
                backdropFilter: "blur(8px)",
                display: "grid",
                placeItems: "center",
                boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
              }}
            >
              <MenuBookRoundedIcon sx={{ fontSize: 32 }} />
            </Box>
          </Box>

          <Typography
            className="splash-rise"
            sx={{
              fontSize: 12.5,
              fontWeight: 700,
              letterSpacing: "0.22em",
              opacity: 0.78,
              mb: 1.25,
              animationDelay: "80ms",
            }}
          >
            EMPTY · YOUR · SHELF
          </Typography>
          <Typography
            className="splash-rise"
            sx={{
              fontSize: 42,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              animationDelay: "140ms",
              textShadow: "0 2px 24px rgba(0,0,0,0.18)",
            }}
          >
            책장비움
          </Typography>
          <Typography
            className="splash-rise"
            sx={{
              fontSize: 16,
              opacity: 0.88,
              mt: 1.75,
              lineHeight: 1.6,
              maxWidth: 320,
              animationDelay: "220ms",
            }}
          >
            내 책장의 책,
            <br />
            이웃에게 다시 흐르게.
          </Typography>

          {/* 라이브 활동 인디케이터 */}
          <Stack
            className="splash-rise"
            direction="row"
            alignItems="center"
            gap={1}
            sx={{
              mt: 3,
              px: 1.5,
              py: 0.85,
              width: "fit-content",
              borderRadius: 999,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.14)",
              backdropFilter: "blur(6px)",
              animationDelay: "300ms",
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#7CE0B0",
                boxShadow: "0 0 0 4px rgba(124,224,176,0.18)",
              }}
            />
            <Typography sx={{ fontSize: 12, fontWeight: 600, opacity: 0.95 }}>
              지금 <strong style={{ fontWeight: 800 }}>3,250명</strong>이 책장을
              비우고 있어요
            </Typography>
          </Stack>
        </Box>

        <Stack
          gap={1.25}
          className="safe-bottom splash-rise"
          sx={{ animationDelay: "380ms" }}
        >
          <Button
            fullWidth
            onClick={goLogin}
            disabled={navigating}
            sx={{
              background: "#fff",
              color: palette.primaryDark,
              fontWeight: 800,
              minHeight: 54,
              fontSize: 15,
              boxShadow: "0 12px 28px rgba(0,0,0,0.22)",
              "&:hover": { background: "#F5F5F0" },
              "&.Mui-disabled": {
                background: "rgba(255,255,255,0.6)",
                color: palette.primaryDark,
              },
            }}
          >
            시작하기
          </Button>
          <Button
            fullWidth
            variant="text"
            onClick={() => router.push("/home")}
            endIcon={<ArrowForwardRoundedIcon />}
            sx={{
              color: "rgba(255,255,255,0.85)",
              mt: 0.5,
              fontWeight: 600,
              "&:hover": { background: "rgba(255,255,255,0.08)", color: "#fff" },
            }}
          >
            로그인 없이 둘러보기
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
