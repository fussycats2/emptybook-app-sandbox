"use client";

// 데스크톱에서는 좌측 브랜드 패널 + 우측 420px 모바일 카드, 모바일에서는 풀스크린
// 모든 페이지를 감싸는 최외곽 프레임 컴포넌트

import { Box, Stack, Typography } from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import { palette, shadow } from "@/lib/theme";

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
        background: {
          // xs(모바일): 단색 배경 / md(데스크톱): 그린 그라데이션
          xs: palette.bg,
          md: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.primaryDark} 100%)`,
        },
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* 데스크톱(md) 이상에서만 보이는 좌측 브랜드 소개 패널 — 모바일에서는 숨김 */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flex: 1,
          maxWidth: 520,
          color: "#fff",
          p: 8,
          flexDirection: "column",
          justifyContent: "center",
          gap: 3,
        }}
      >
        <Stack direction="row" gap={1.25} alignItems="center">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              background: "rgba(255,255,255,0.16)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <MenuBookIcon />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: 22 }}>
            책장비움
          </Typography>
        </Stack>
        <Typography sx={{ fontSize: 36, fontWeight: 800, lineHeight: 1.2 }}>
          내 책장의 책,
          <br />
          이웃에게 다시 흐르게.
        </Typography>
        <Typography sx={{ opacity: 0.85, fontSize: 15, lineHeight: 1.6 }}>
          중고 도서를 가볍고 따뜻하게 거래해요.
          <br />
          쌓여가는 책을 정리하고, 새로운 인연을 만나보세요.
        </Typography>
        <Stack direction="row" gap={2} sx={{ mt: 2 }}>
          <Stat label="등록된 책" value="12,840" />
          <Stat label="활성 사용자" value="3,250" />
          <Stat label="이번 달 거래" value="980" />
        </Stack>
      </Box>

      {/* 실제 앱이 들어가는 모바일 카드 영역 — 페이지 콘텐츠는 children 으로 주입 */}
      <Box
        sx={{
          width: { xs: "100vw", md: 420 },
          maxWidth: "100vw",
          // 데스크톱에선 화면 높이에 맞춰 최대 860px 까지만, 좌우/상하 여유 확보
          height: { xs: "100dvh", md: "min(860px, calc(100dvh - 32px))" },
          background: palette.bg,
          borderRadius: { xs: 0, md: "28px" },
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          boxShadow: { xs: "none", md: shadow.raised },
          border: { xs: "none", md: `1px solid rgba(255,255,255,0.2)` },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

// 좌측 패널의 숫자 통계 한 칸 (등록된 책/활성 사용자/거래 등)
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography sx={{ fontWeight: 800, fontSize: 22 }}>{value}</Typography>
      <Typography sx={{ opacity: 0.75, fontSize: 12 }}>{label}</Typography>
    </Box>
  );
}
