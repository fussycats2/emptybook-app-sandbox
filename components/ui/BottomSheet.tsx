"use client";

// 화면 아래에서 올라오는 시트(BottomSheet) 컴포넌트
// - 검색 필터, 옵션 선택, 신고/삭제 메뉴 등에 사용
// - MUI의 Drawer를 anchor="bottom" 으로 사용하고 모바일 카드 폭(420)에 맞게 보정

import { Box, Drawer, Typography } from "@mui/material";
import { palette, radius } from "@/lib/theme";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  height?: number | string;
}

export default function BottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
  height = "auto",
}: Props) {
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          maxWidth: 420,
          mx: "auto",
          borderTopLeftRadius: `${radius.xl}px`,
          borderTopRightRadius: `${radius.xl}px`,
          background: palette.surface,
          maxHeight: "85dvh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 -10px 40px rgba(26,38,32,0.20)",
        },
      }}
      sx={{
        "& .MuiDrawer-paper": {
          width: { xs: "100%", md: 420 },
        },
        "& .MuiBackdrop-root": {
          backgroundColor: "rgba(26, 38, 32, 0.45)",
          backdropFilter: "blur(2px)",
        },
      }}
    >
      {/* 시트 상단의 작은 손잡이(grabber) — 드래그할 수 있다는 시각적 힌트 */}
      <Box sx={{ display: "grid", placeItems: "center", pt: 1.25, pb: 0.5 }}>
        <Box
          sx={{
            width: 44,
            height: 4,
            borderRadius: 999,
            background: palette.line,
          }}
        />
      </Box>
      {title && (
        <Box sx={{ px: 2.5, py: 1.5 }}>
          <Typography
            sx={{
              fontSize: 17,
              fontWeight: 800,
              letterSpacing: "-0.025em",
            }}
          >
            {title}
          </Typography>
        </Box>
      )}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          px: 2.5,
          pb: 2,
          height,
        }}
      >
        {children}
      </Box>
      {footer && (
        <Box
          className="safe-bottom"
          sx={{
            borderTop: `1px solid ${palette.lineSoft}`,
            p: 1.75,
            background: palette.surface,
          }}
        >
          {footer}
        </Box>
      )}
    </Drawer>
  );
}
