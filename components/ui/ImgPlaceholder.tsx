"use client";

// 와이어프레임 스타일의 X자 자리표시 박스
// (디자인 시안 단계에서 "이미지 들어올 자리"를 표시할 때 사용)

import { Box } from "@mui/material";
import { palette } from "@/lib/theme";

interface Props {
  width?: number | string;
  height?: number | string;
  radius?: number;
  sx?: any;
}

export default function ImgPlaceholder({
  width = "100%",
  height = 120,
  radius = 0,
  sx,
}: Props) {
  return (
    <Box
      sx={{
        width,
        height,
        border: `1.5px solid ${palette.gray3}`,
        background: palette.gray1,
        position: "relative",
        flexShrink: 0,
        borderRadius: `${radius}px`,
        ...sx,
      }}
    >
      <svg
        width="100%"
        height="100%"
        style={{ position: "absolute", top: 0, left: 0 }}
        preserveAspectRatio="none"
      >
        <line
          x1="0"
          y1="0"
          x2="100%"
          y2="100%"
          stroke={palette.gray3}
          strokeWidth="1.5"
        />
        <line
          x1="100%"
          y1="0"
          x2="0"
          y2="100%"
          stroke={palette.gray3}
          strokeWidth="1.5"
        />
      </svg>
    </Box>
  );
}
