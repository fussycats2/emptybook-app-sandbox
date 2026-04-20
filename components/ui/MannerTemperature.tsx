"use client";

import { Box, Stack, Typography } from "@mui/material";
import { palette } from "@/lib/theme";

export default function MannerTemperature({
  value = 36.5,
  size = "md",
}: {
  value?: number;
  size?: "sm" | "md" | "lg";
}) {
  const min = 30;
  const max = 50;
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const color =
    value >= 42
      ? "#FF6B5E"
      : value >= 38
      ? "#F08A2A"
      : value >= 36
      ? palette.primary
      : "#7A8FB0";

  const fontSize = size === "lg" ? 22 : size === "sm" ? 13 : 16;
  const labelSize = size === "lg" ? 12 : 10.5;

  return (
    <Box sx={{ minWidth: size === "lg" ? 140 : 96 }}>
      <Stack direction="row" alignItems="baseline" gap={0.5}>
        <Typography sx={{ fontWeight: 800, color, fontSize }}>
          {value.toFixed(1)}℃
        </Typography>
        <Typography
          sx={{
            fontSize: labelSize,
            color: palette.inkMute,
            fontWeight: 600,
          }}
        >
          매너온도
        </Typography>
      </Stack>
      <Box
        sx={{
          mt: 0.75,
          height: 6,
          borderRadius: 999,
          background: palette.lineSoft,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            width: `${pct * 100}%`,
            height: "100%",
            background: color,
            borderRadius: 999,
            transition: "width 400ms",
          }}
        />
      </Box>
    </Box>
  );
}
