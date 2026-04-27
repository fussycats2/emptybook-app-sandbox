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
      alignItems="center"
      justifyContent="center"
      sx={{ py: 8, px: 4, textAlign: "center", color: palette.inkMute }}
      gap={2}
    >
      <Box
        sx={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: palette.primarySoft,
          color: palette.primary,
          display: "grid",
          placeItems: "center",
          fontSize: 32,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontSize: 16, fontWeight: 800, color: palette.ink }}>
          {title}
        </Typography>
        {description && (
          <Typography sx={{ fontSize: 13, mt: 0.75, lineHeight: 1.55 }}>
            {description}
          </Typography>
        )}
      </Box>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="outlined" size="small">
          {actionLabel}
        </Button>
      )}
    </Stack>
  );
}
