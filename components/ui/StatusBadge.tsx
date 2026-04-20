"use client";

import { Box } from "@mui/material";
import { palette } from "@/lib/theme";

export type SaleStatus = "selling" | "reserved" | "sold" | "free";

const MAP: Record<
  SaleStatus,
  { label: string; bg: string; fg: string }
> = {
  selling: { label: "판매중", bg: palette.primarySoft, fg: palette.primary },
  reserved: { label: "예약중", bg: "#FFF1E0", fg: "#B16A00" },
  sold: { label: "거래완료", bg: "#EEEDE9", fg: palette.inkMute },
  free: { label: "무료나눔", bg: "#FCE8E5", fg: palette.accent },
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
