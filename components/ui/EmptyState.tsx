"use client";

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
