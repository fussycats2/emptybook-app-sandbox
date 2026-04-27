"use client";

// 헤더 좌측에 표시되는 동네(지역) 드롭다운 칩
// 클릭 시 동네 변경 시트를 여는 용도로 onClick 을 외부에서 주입
// TODO: 현재는 라벨만 받음. 사용자의 활성 지역 목록 연동 필요

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
        gap: 0.25,
        cursor: "pointer",
        color: palette.ink,
        fontWeight: 800,
        fontSize: 16,
        px: 0.5,
        ml: -0.5,
        py: 0.25,
        borderRadius: 999,
        transition: "background 120ms",
        "&:hover": { background: palette.lineSoft },
      }}
    >
      <LocationOnRoundedIcon sx={{ fontSize: 18, color: palette.primary }} />
      {label}
      <KeyboardArrowDownRoundedIcon sx={{ fontSize: 18, color: palette.inkMute }} />
    </Box>
  );
}
