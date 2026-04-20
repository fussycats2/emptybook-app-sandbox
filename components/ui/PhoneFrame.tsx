"use client";

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
        height: "100dvh",
        width: "100vw",
        overflow: "hidden",
        background: {
          xs: palette.bg,
          md: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.primaryDark} 100%)`,
        },
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
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

      <Box
        sx={{
          width: { xs: "100vw", md: 420 },
          maxWidth: "100vw",
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography sx={{ fontWeight: 800, fontSize: 22 }}>{value}</Typography>
      <Typography sx={{ opacity: 0.75, fontSize: 12 }}>{label}</Typography>
    </Box>
  );
}
