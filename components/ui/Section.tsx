"use client";

import { Box } from "@mui/material";
import { palette, shadow } from "@/lib/theme";

export function SectionLabel({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 2,
        pt: 2.5,
        pb: 1,
      }}
    >
      <Box sx={{ fontSize: 15, fontWeight: 800, color: palette.ink }}>
        {children}
      </Box>
      {right}
    </Box>
  );
}

export function ScrollBody({
  children,
  sx,
  onScroll,
}: {
  children: React.ReactNode;
  sx?: any;
  onScroll?: React.UIEventHandler<HTMLDivElement>;
}) {
  return (
    <Box
      onScroll={onScroll}
      sx={{
        flex: 1,
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

export function FixedFooter({
  children,
  bordered = true,
}: {
  children: React.ReactNode;
  bordered?: boolean;
}) {
  return (
    <Box
      className="safe-bottom"
      sx={{
        p: "12px 16px",
        borderTop: bordered ? `1px solid ${palette.line}` : "none",
        background: palette.surface,
        flexShrink: 0,
        boxShadow: shadow.sticky,
        position: "sticky",
        bottom: 0,
        zIndex: 5,
      }}
    >
      {children}
    </Box>
  );
}
