"use client";

// 책 표지 자리 표시(placeholder) 이미지 컴포넌트
// - 실제 이미지(src)가 있으면 그걸 보여주고
// - 없으면 seed(예: 책 id)에 따라 결정되는 색조합 + 책 아이콘으로 채운다
// TODO: Storage 연동 후 src 가 항상 들어오면 분기 단순화 가능

import { Box } from "@mui/material";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import { palette } from "@/lib/theme";

interface Props {
  width?: number | string;
  height?: number | string;
  ratio?: number;
  radius?: number;
  seed?: string | number;
  src?: string;
  sx?: any;
  badge?: React.ReactNode;
  overlay?: React.ReactNode;
}

// 자리 표시용 색상 팔레트 (배경색, 전경색) 쌍 6개
const PALETTES = [
  ["#E8F2EC", "#1F6F4E"],
  ["#FCEFE9", "#C44A3C"],
  ["#EEEAF7", "#5B47B6"],
  ["#FBF4DC", "#A0791E"],
  ["#E5EEF7", "#225089"],
  ["#F2EFE8", "#5A6B62"],
];

// seed 값을 해싱해 항상 같은 책이면 같은 색이 나오도록 함
// (h * 31 + charCode) 는 자바 스타일의 단순한 문자열 해시
function pick(seed?: string | number) {
  const key = String(seed ?? "x");
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return PALETTES[h % PALETTES.length];
}

export default function BookImage({
  width = "100%",
  height,
  ratio,
  radius = 12,
  seed,
  src,
  sx,
  badge,
  overlay,
}: Props) {
  const [bg, fg] = pick(seed);
  const aspect = ratio ?? 1;
  return (
    <Box
      sx={{
        width,
        height: height ?? "auto",
        aspectRatio: height ? undefined : `${aspect} / 1`,
        borderRadius: `${radius}px`,
        position: "relative",
        overflow: "hidden",
        background: src
          ? `url(${src}) center/cover no-repeat`
          : `linear-gradient(135deg, ${bg} 0%, ${bg} 60%, rgba(255,255,255,0.6) 100%)`,
        flexShrink: 0,
        ...sx,
      }}
    >
      {!src && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            color: fg,
            opacity: 0.55,
          }}
        >
          <MenuBookRoundedIcon sx={{ fontSize: "min(40%, 64px)" }} />
        </Box>
      )}
      {!src && (
        <Box
          sx={{
            position: "absolute",
            left: 8,
            right: 8,
            bottom: 8,
            color: fg,
            opacity: 0.4,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1.5,
            textTransform: "uppercase",
          }}
        >
          EMPTYBOOK
        </Box>
      )}
      {badge && (
        <Box sx={{ position: "absolute", top: 8, left: 8 }}>{badge}</Box>
      )}
      {overlay}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          borderRadius: `${radius}px`,
          boxShadow: "inset 0 0 0 1px rgba(26,43,34,0.04)",
          pointerEvents: "none",
        }}
      />
    </Box>
  );
}
