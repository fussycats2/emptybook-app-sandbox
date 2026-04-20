"use client";

import { Box, IconButton, Typography } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import CloseIcon from "@mui/icons-material/Close";
import { useRouter } from "next/navigation";
import { palette } from "@/lib/theme";

export type HeaderLeft = "back" | "close" | "none";

interface Props {
  title?: React.ReactNode;
  left?: HeaderLeft;
  right?: React.ReactNode;
  onLeftClick?: () => void;
  centered?: boolean;
  transparent?: boolean;
  bordered?: boolean;
}

export default function AppHeader({
  title,
  left = "back",
  right = null,
  onLeftClick,
  centered = true,
  transparent = false,
  bordered = true,
}: Props) {
  const router = useRouter();

  const handleLeft = () => {
    if (onLeftClick) onLeftClick();
    else router.back();
  };

  return (
    <Box
      sx={{
        height: 56,
        borderBottom: bordered ? `1px solid ${palette.line}` : "none",
        display: "flex",
        alignItems: "center",
        px: 1,
        gap: 1,
        flexShrink: 0,
        background: transparent ? "transparent" : palette.surface,
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <Box sx={{ width: 44, display: "flex", justifyContent: "center" }}>
        {left !== "none" && (
          <IconButton onClick={handleLeft} aria-label="back">
            {left === "close" ? (
              <CloseIcon sx={{ color: palette.ink }} />
            ) : (
              <ArrowBackIosNewIcon fontSize="small" sx={{ color: palette.ink }} />
            )}
          </IconButton>
        )}
      </Box>
      <Typography
        component="h1"
        sx={{
          flex: 1,
          fontWeight: 700,
          fontSize: 16,
          textAlign: centered ? "center" : "left",
          color: palette.ink,
        }}
      >
        {title}
      </Typography>
      <Box
        sx={{
          minWidth: 44,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          pr: 0.5,
        }}
      >
        {right}
      </Box>
    </Box>
  );
}
