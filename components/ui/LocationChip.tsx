"use client";

import { Box } from "@mui/material";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import { palette } from "@/lib/theme";

export default function LocationChip({
  label = "마포구",
  onClick,
}: {
  label?: string;
  onClick?: () => void;
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        cursor: "pointer",
        color: palette.ink,
        fontWeight: 800,
        fontSize: 16,
      }}
    >
      <LocationOnRoundedIcon sx={{ fontSize: 18, color: palette.primary }} />
      {label}
      <KeyboardArrowDownRoundedIcon sx={{ fontSize: 18 }} />
    </Box>
  );
}
