"use client";

// 화면 아래에서 올라오는 시트(BottomSheet) 컴포넌트
// - 검색 필터, 옵션 선택, 신고/삭제 메뉴 등에 사용
// - MUI의 Drawer를 anchor="bottom" 으로 사용하고 모바일 카드 폭(420)에 맞게 보정

import { Box, Drawer, Typography } from "@mui/material";
import { palette } from "@/lib/theme";

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
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          background: palette.surface,
          maxHeight: "85dvh",
          display: "flex",
          flexDirection: "column",
        },
      }}
      sx={{
        "& .MuiDrawer-paper": {
          width: { xs: "100%", md: 420 },
        },
      }}
    >
      {/* 시트 상단의 작은 손잡이(grabber) — 드래그할 수 있다는 시각적 힌트 */}
      <Box sx={{ display: "grid", placeItems: "center", pt: 1, pb: 0.5 }}>
        <Box
          sx={{
            width: 40,
            height: 4,
            borderRadius: 999,
            background: palette.line,
          }}
        />
      </Box>
      {title && (
        <Box sx={{ px: 2.5, py: 1.25 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 800 }}>{title}</Typography>
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
            borderTop: `1px solid ${palette.line}`,
            p: 1.5,
            background: palette.surface,
          }}
        >
          {footer}
        </Box>
      )}
    </Drawer>
  );
}
