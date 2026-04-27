"use client";

// 매너온도 표시(당근마켓 컨셉의 평판 점수)
// 30~50℃ 범위를 막대로 시각화하고, 값 구간에 따라 색을 다르게 표시한다

import { Box, Stack, Typography } from "@mui/material";
import { palette } from "@/lib/theme";

export default function MannerTemperature({
  value = 36.5,
  size = "md",
}: {
  value?: number;
  size?: "sm" | "md" | "lg";
}) {
  // 막대의 채움 비율 계산: 30 미만은 0, 50 초과는 1로 클램프
  const min = 30;
  const max = 50;
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  // 온도 구간별 색상: 42 이상 빨강, 38 이상 주황, 36 이상 그린, 그 아래 회색
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
    <Box sx={{ minWidth: size === "lg" ? 140 : 88 }}>
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
