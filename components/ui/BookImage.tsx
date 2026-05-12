"use client";

// 책 표지 자리 표시(placeholder) 이미지 컴포넌트
// - 실제 이미지(src)가 있으면 잘림 없이 표시
// - 두 가지 모드:
//   1) 고정 박스(default): width × height 또는 width × aspectRatio 고정 박스 안에 contain.
//      letterbox 영역은 동일 표지의 블러 백드롭으로 채움(theater backdrop).
//   2) autoWidth (book-real): height 만 고정, width 는 이미지 자연 비율로 가변.
//      로드 전 2:3 비율 placeholder. 책장 카드처럼 책별 너비가 살짝 달라도 자연스러운 표시.
// - src 가 없으면 seed(예: 책 id)에 따라 결정되는 색조합 + 책 아이콘으로 채운다

import { Box } from "@mui/material";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import { useState } from "react";

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
  /** src 가 있을 때 letterbox 영역을 같은 이미지의 블러로 채울지(=영화관 모드).
   *  기본 true — 책 표지 잘림 없이 부드럽게 보이게.
   *  autoWidth 모드에서는 letterbox 자체가 없어 자동으로 false 가 됨. */
  theaterBackdrop?: boolean;
  /** true 면 width 가변(이미지 자연 비율). height 만 고정. 로드 전엔 2:3 placeholder. */
  autoWidth?: boolean;
}

// 자리 표시용 색상 팔레트 (배경색, 전경색) 쌍 — 새 테마와 맞춘 차분한 6색
// 톤: sage green / terracotta / dusty plum / honey / steel blue / warm gray
const PALETTES = [
  ["#E6EFEA", "#2D5F4A"],
  ["#F6E6E1", "#A04A3D"],
  ["#ECE5E8", "#6B5060"],
  ["#F4ECD9", "#8C6B26"],
  ["#E5ECEF", "#3F5C70"],
  ["#EFEBE3", "#5C6B63"],
];

// seed 값을 해싱해 항상 같은 책이면 같은 색이 나오도록 함
// (h * 31 + charCode) 는 자바 스타일의 단순한 문자열 해시
function pick(seed?: string | number) {
  const key = String(seed ?? "x");
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return PALETTES[h % PALETTES.length];
}

// 표준 책 비율 (width:height). 로드 전 placeholder 용.
const BOOK_RATIO = 2 / 3;

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
  theaterBackdrop = true,
  autoWidth = false,
}: Props) {
  const [bg, fg] = pick(seed);
  // autoWidth 모드 — 이미지 자연 비율 측정 후 width 계산. 로드 전엔 2:3.
  const [naturalRatio, setNaturalRatio] = useState<number | null>(null);
  const heightNum = typeof height === "number" ? height : undefined;
  // autoWidth 모드의 실 너비 계산. height 가 숫자가 아니면 안전하게 width prop 폴백.
  const computedWidth =
    autoWidth && heightNum != null
      ? Math.round((naturalRatio ?? BOOK_RATIO) * heightNum)
      : width;
  // autoWidth 일 때 backdrop 은 의미 없음 (letterbox 가 사라지므로). 강제로 끔.
  const useBackdrop = theaterBackdrop && !autoWidth;
  const aspect = ratio ?? 1;
  return (
    <Box
      sx={{
        width: computedWidth,
        height: height ?? "auto",
        aspectRatio: height || autoWidth ? undefined : `${aspect} / 1`,
        borderRadius: `${radius}px`,
        position: "relative",
        overflow: "hidden",
        background: src
          ? bg
          : `linear-gradient(135deg, ${bg} 0%, ${bg} 60%, rgba(255,255,255,0.6) 100%)`,
        flexShrink: 0,
        ...sx,
      }}
    >
      {/* 블러 백드롭 — autoWidth 모드 아닐 때만. letterbox 영역을 같은 이미지의 블러로 채움. */}
      {src && useBackdrop && (
        <>
          <Box
            component="img"
            src={src}
            alt=""
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "blur(14px) saturate(120%)",
              transform: "scale(1.25)",
              opacity: 0.8,
            }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.02) 50%, rgba(0,0,0,0.08) 100%)",
            }}
          />
        </>
      )}
      {/* 실제 표지 */}
      {src && (
        <Box
          component="img"
          src={src}
          alt=""
          onLoad={(e: React.SyntheticEvent<HTMLImageElement>) => {
            if (!autoWidth) return;
            const img = e.currentTarget;
            if (img.naturalHeight > 0) {
              setNaturalRatio(img.naturalWidth / img.naturalHeight);
            }
          }}
          sx={{
            position: "relative",
            width: "100%",
            height: "100%",
            // autoWidth: 부모 박스가 이미 정확한 너비를 갖고 있어 cover/contain 차이 없음.
            //           cover 가 더 안전(둥근 모서리 안쪽도 깔끔하게 채워짐).
            // 일반 모드: contain — letterbox 는 backdrop 으로 채움.
            objectFit: autoWidth ? "cover" : "contain",
            display: "block",
          }}
        />
      )}
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
    </Box>
  );
}
