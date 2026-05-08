"use client";

// 책 페이지가 한 장씩 넘어가는 로딩 인디케이터
// - 정가운데 돌아가는 spinner 대안. 브랜드 톤(책) 과 어울려 "로딩 중" 인지가 자연스럽게 됨
// - 순수 CSS — globals.css 의 `@keyframes bookFlip` 사용 (외부 자산/라이브러리 X)
// - 사용처:
//     <BookLoader />                       — 인라인, 가운데 정렬
//     <BookLoader size={72} label="..." /> — 캡션 같이
//     <BookLoader fullPage />              — 부모 컨테이너 채워서 정중앙

import { Box } from "@mui/material";
import { palette } from "@/lib/theme";

interface Props {
  // 책 가로 길이(px). 세로는 0.72 비율로 자동
  size?: number;
  // 아이콘 아래에 노출할 캡션 (예: "불러오는 중…")
  label?: string;
  // true 면 부모 영역(position: relative 권장) 을 채워서 절대 가운데 정렬
  fullPage?: boolean;
}

export default function BookLoader({ size = 56, label, fullPage }: Props) {
  const W = size;
  const H = Math.round(size * 0.72);
  // 페이지 한 장 폭은 책 폭의 절반에서 척추(spine) 1px 빼기
  const pageW = W / 2 - 1;
  // 페이지 색상 — sage 톤 살짝 (브랜드와 어울리게)
  const pageA = palette.surface; // 가장 위 페이지 — 밝게
  const pageB = palette.surfaceAlt; // 그 아래 페이지 — 살짝 톤
  const spine = palette.primary; // 책 척추(가운데 세로선)
  const cover = palette.primaryDark; // 표지 톤

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: label ? 1.25 : 0,
        ...(fullPage && {
          position: "absolute",
          inset: 0,
          justifyContent: "center",
          pointerEvents: "none",
        }),
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: W,
          height: H,
          perspective: `${W * 4}px`,
          // 책 펼친 모양 — 좌우 페이지 + 가운데 척추(살짝 어두운 선) + 표지 그림자
          // 표지: 살짝 더 큰 어두운 직사각형으로 뒤에 깔아 두께 표현
          "&::before": {
            content: '""',
            position: "absolute",
            inset: -2,
            background: cover,
            borderRadius: 4,
            opacity: 0.85,
            zIndex: 0,
          },
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 0,
            background: `linear-gradient(90deg, ${pageA} 0%, ${pageA} 49.5%, ${spine} 49.5%, ${spine} 50.5%, ${pageA} 50.5%, ${pageA} 100%)`,
            borderRadius: 2,
            zIndex: 1,
            boxShadow: "inset 0 -2px 6px rgba(0,0,0,0.04)",
          },
        }}
      >
        {/* 넘어가는 페이지 — 오른쪽에서 시작해 왼쪽으로 회전 (transform-origin: 중앙 척추) */}
        <Box
          sx={{
            position: "absolute",
            top: 1,
            left: W / 2,
            width: pageW,
            height: H - 2,
            background: `linear-gradient(90deg, ${pageA} 0%, ${pageB} 100%)`,
            // 우상단 모서리에 살짝 곡률 — 종이 두께감
            borderTopRightRadius: 2,
            borderBottomRightRadius: 2,
            boxShadow: "0 0 4px rgba(0,0,0,0.06)",
            transformOrigin: "left center",
            transformStyle: "preserve-3d",
            backfaceVisibility: "hidden",
            zIndex: 2,
            animation: "bookFlip 1.4s ease-in-out infinite",
          }}
        />
      </Box>
      {label && (
        <Box
          sx={{
            fontSize: 12,
            fontWeight: 700,
            color: palette.inkMute,
            letterSpacing: "-0.01em",
          }}
        >
          {label}
        </Box>
      )}
    </Box>
  );
}
