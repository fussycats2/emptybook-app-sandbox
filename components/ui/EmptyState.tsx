"use client";

// 데이터가 없을 때 보여줄 안내 화면 (목록이 비었을 때, 검색 결과 0건 등)
// 아이콘 + 제목 + 부가 설명 + 선택적 액션 버튼 구조

import { Box, Stack, Typography, Button } from "@mui/material";
import { palette } from "@/lib/theme";

interface Props {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: Props) {
  return (
    <Stack
      className="fade-in-up"
      alignItems="center"
      justifyContent="center"
      sx={{ py: 8, px: 4, textAlign: "center", color: palette.inkMute }}
      gap={2.25}
    >
      <Box
        sx={{
          width: 84,
          height: 84,
          borderRadius: "50%",
          background: `radial-gradient(circle at 30% 30%, ${palette.primaryTint} 0%, ${palette.primarySoft} 100%)`,
          color: palette.primary,
          display: "grid",
          placeItems: "center",
          fontSize: 36,
          boxShadow: `inset 0 0 0 1px ${palette.lineSoft}`,
          position: "relative",
        }}
      >
        {/* 아이콘 주변의 미세한 글로우 — 모던 톤 */}
        <Box
          sx={{
            position: "absolute",
            inset: -8,
            borderRadius: "50%",
            background: palette.primaryGlow,
            filter: "blur(16px)",
            zIndex: -1,
          }}
        />
        {icon}
      </Box>
      <Box sx={{ maxWidth: 280 }}>
        <Typography
          sx={{
            fontSize: 16.5,
            fontWeight: 800,
            color: palette.ink,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </Typography>
        {description && (
          <Typography
            sx={{
              fontSize: 13.5,
              mt: 1,
              lineHeight: 1.65,
              color: palette.inkMute,
            }}
          >
            {description}
          </Typography>
        )}
      </Box>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="outlined" size="small" sx={{ mt: 0.5, px: 2.5 }}>
          {actionLabel}
        </Button>
      )}
    </Stack>
  );
}
