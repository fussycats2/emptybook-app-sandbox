"use client";

// 매너온도 표시(당근마켓 컨셉의 평판 점수)
// 30~50℃ 범위를 막대로 시각화하고, 값 구간에 따라 색을 다르게 표시한다

import { Box, Stack, Typography } from "@mui/material";
import { palette } from "@/lib/theme";

// 매너온도 휴리스틱 (당근마켓 컨셉의 가짜 평판 점수)
//
//   temp = 36.5 + tradeBonus + ratingBonus
//
//   tradeBonus  = min(trade, 50) × 0.15   → 거래 0회: 0, 50회: +7.5
//   ratingBonus = max(0, rating − 3.0) × 1.0   → 별점 3점 이하: 0, 5점: +2.0
//
// 예) 거래 12회 / 별점 4.5 → 36.5 + 1.8 + 1.5 = 39.8℃
//     거래 50회 / 별점 5.0 → 36.5 + 7.5 + 2.0 = 46.0℃
//     거래 0회  / 후기 없음 → 36.5℃ (체온 베이스)
//
// trade_count 는 0020 트리거가 transactions(COMPLETED) 기준으로 갱신,
// rating_avg 는 0003 트리거가 reviews 기준으로 갱신. 두 입력의 누적이 매너온도.
// SellerCard / 마이페이지 본인 카드 모두 이 헬퍼 한 곳에서 계산.
export function calcMannerTemperature(
  tradeCount: number | null | undefined,
  rating?: number | null
): number {
  const t = Math.max(0, Math.min(50, tradeCount ?? 0));
  const r = rating ?? 0;
  const tradeBonus = t * 0.15;
  const ratingBonus = r > 3 ? (r - 3) * 1.0 : 0;
  return Number((36.5 + tradeBonus + ratingBonus).toFixed(1));
}

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
  // 온도 구간별 색상: 42 이상 코랄, 38 이상 머스타드, 36 이상 그린, 그 아래 차가운 회색
  const color =
    value >= 42
      ? palette.accent
      : value >= 38
      ? palette.warn
      : value >= 36
      ? palette.primary
      : palette.inkSubtle;

  // 그라데이션으로 채움 — 단색보다 모던
  const fillGradient =
    value >= 42
      ? `linear-gradient(90deg, ${palette.warn} 0%, ${palette.accent} 100%)`
      : value >= 38
      ? `linear-gradient(90deg, ${palette.primary} 0%, ${palette.warn} 100%)`
      : value >= 36
      ? `linear-gradient(90deg, ${palette.success} 0%, ${palette.primary} 100%)`
      : `linear-gradient(90deg, ${palette.inkSubtle} 0%, ${palette.inkMute} 100%)`;

  const fontSize = size === "lg" ? 24 : size === "sm" ? 13 : 16;
  const labelSize = size === "lg" ? 12 : 10.5;

  return (
    <Box sx={{ minWidth: size === "lg" ? 140 : 88 }}>
      <Stack direction="row" alignItems="baseline" gap={0.5}>
        <Typography
          sx={{
            fontWeight: 800,
            color,
            fontSize,
            letterSpacing: "-0.025em",
          }}
        >
          {value.toFixed(1)}℃
        </Typography>
        <Typography
          sx={{
            fontSize: labelSize,
            color: palette.inkMute,
            fontWeight: 600,
            letterSpacing: "-0.01em",
          }}
        >
          매너온도
        </Typography>
      </Stack>
      <Box
        sx={{
          mt: 0.85,
          height: size === "lg" ? 8 : 6,
          borderRadius: 999,
          background: palette.lineSoft,
          overflow: "hidden",
          boxShadow: `inset 0 1px 2px rgba(26,38,32,0.06)`,
        }}
      >
        <Box
          sx={{
            width: `${pct * 100}%`,
            height: "100%",
            background: fillGradient,
            borderRadius: 999,
            transition: "width 600ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </Box>
    </Box>
  );
}
