"use client";

// 책/거래 상태를 한 줄로 보여주는 작은 배지 (판매중/예약중/거래완료/무료나눔/취소)
// 색상/라벨은 MAP 한 곳에서만 관리해 일관성 유지

import { Box } from "@mui/material";
import { palette } from "@/lib/theme";

// 화면에서 다루는 판매 상태(서버 enum 과 다른, UI 전용 값)
export type SaleStatus =
  | "selling"
  | "reserved"
  | "sold"
  | "free"
  | "canceled";

// 상태별 라벨 + 배경/전경 색상 매핑
const MAP: Record<
  SaleStatus,
  { label: string; bg: string; fg: string }
> = {
  selling: { label: "판매중", bg: palette.primarySoft, fg: palette.primary },
  reserved: { label: "예약중", bg: "#FFF1E0", fg: "#B16A00" },
  sold: { label: "거래완료", bg: "#EEEDE9", fg: palette.inkMute },
  free: { label: "무료나눔", bg: "#FCE8E5", fg: palette.accent },
  canceled: { label: "취소", bg: "#F5EEEE", fg: "#9A7A7A" },
};

export default function StatusBadge({
  status,
  size = "md",
}: {
  status: SaleStatus;
  size?: "sm" | "md";
}) {
  const conf = MAP[status];
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        background: conf.bg,
        color: conf.fg,
        fontWeight: 700,
        fontSize: size === "sm" ? 10.5 : 12,
        height: size === "sm" ? 20 : 24,
        px: size === "sm" ? 0.75 : 1,
        borderRadius: 999,
      }}
    >
      {conf.label}
    </Box>
  );
}
