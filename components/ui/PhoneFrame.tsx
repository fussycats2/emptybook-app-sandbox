"use client";

// 데스크톱에서는 좌측 브랜드 패널 + 우측 420px 모바일 카드, 모바일에서는 풀스크린
// 모든 페이지를 감싸는 최외곽 프레임 컴포넌트

import { Box, Stack, Typography } from "@mui/material";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import { palette, radius, shadow } from "@/lib/theme";

export default function PhoneFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        height: "100dvh", // dvh: 동적 뷰포트 높이 (모바일 주소창 높이 변화 대응)
        width: "100vw",
        overflow: "hidden",
        // xs(모바일): 단색 / md(데스크톱): 그린→다크그린 그라데이션 + 미세한 텍스처
        background: {
          xs: palette.bg,
          md: `radial-gradient(120% 80% at 0% 0%, ${palette.primary} 0%, ${palette.primaryDark} 60%, #14302A 100%)`,
        },
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {/* 데스크톱 배경에 은은한 라이팅 글로우 — 너무 평면적이지 않게 */}
      <Box
        sx={{
          display: { xs: "none", md: "block" },
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 12% 18%, rgba(255,255,255,0.12) 0%, transparent 38%), radial-gradient(circle at 92% 92%, rgba(255,255,255,0.06) 0%, transparent 35%)",
        }}
      />

      {/* 데스크톱(md) 이상에서만 보이는 좌측 브랜드 소개 패널 — 모바일에서는 숨김 */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          position: "relative",
          flex: 1,
          maxWidth: 540,
          color: "#fff",
          p: 8,
          flexDirection: "column",
          justifyContent: "center",
          gap: 4,
        }}
      >
        <Stack direction="row" gap={1.5} alignItems="center">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              background: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.18)",
              backdropFilter: "blur(6px)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <MenuBookRoundedIcon />
          </Box>
          <Typography
            sx={{ fontWeight: 800, fontSize: 22, letterSpacing: "-0.01em" }}
          >
            책장비움
          </Typography>
        </Stack>

        <Box>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.16em",
              opacity: 0.7,
              mb: 1.5,
            }}
          >
            EMPTY · YOUR · SHELF
          </Typography>
          <Typography
            sx={{
              fontSize: 40,
              fontWeight: 800,
              lineHeight: 1.18,
              letterSpacing: "-0.025em",
            }}
          >
            내 책장의 책,
            <br />
            이웃에게 다시 흐르게.
          </Typography>
          <Typography
            sx={{ opacity: 0.78, fontSize: 15, lineHeight: 1.7, mt: 2.5, maxWidth: 380 }}
          >
            중고 도서를 가볍고 따뜻하게 거래해요.
            <br />
            쌓여가는 책을 정리하고, 새로운 인연을 만나보세요.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 0,
            mt: 1,
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: 3,
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(4px)",
            overflow: "hidden",
          }}
        >
          <Stat label="등록된 책" value="12,840" />
          <Divider />
          <Stat label="활성 사용자" value="3,250" />
          <Divider />
          <Stat label="이번 달 거래" value="980" />
        </Box>
      </Box>

      {/* 실제 앱이 들어가는 모바일 카드 영역 — 페이지 콘텐츠는 children 으로 주입 */}
      <Box
        sx={{
          width: { xs: "100vw", md: 420 },
          maxWidth: "100vw",
          // 데스크톱에선 화면 높이에 맞춰 최대 860px 까지만, 좌우/상하 여유 확보
          height: { xs: "100dvh", md: "min(860px, calc(100dvh - 32px))" },
          background: palette.bg,
          borderRadius: { xs: 0, md: `${radius.xl}px` },
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          boxShadow: { xs: "none", md: shadow.raised },
          border: { xs: "none", md: `1px solid rgba(255,255,255,0.16)` },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

// 좌측 패널의 숫자 통계 한 칸
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ flex: 1, p: 2.25 }}>
      <Typography
        sx={{ fontWeight: 800, fontSize: 22, letterSpacing: "-0.01em" }}
      >
        {value}
      </Typography>
      <Typography sx={{ opacity: 0.7, fontSize: 11.5, mt: 0.25 }}>
        {label}
      </Typography>
    </Box>
  );
}

function Divider() {
  return (
    <Box sx={{ width: "1px", background: "rgba(255,255,255,0.12)" }} />
  );
}
