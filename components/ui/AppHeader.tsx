"use client";

// 화면 상단의 공용 헤더 (뒤로가기/닫기 + 제목 + 우측 액션 슬롯)
// 거의 모든 페이지에서 사용되어 일관된 네비게이션 UX를 제공한다

import { Box, IconButton, Typography } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import CloseIcon from "@mui/icons-material/Close";
import { useRouter } from "next/navigation";
import { palette } from "@/lib/theme";

// 좌측 버튼 종류: 뒤로가기 / 닫기(X) / 없음
export type HeaderLeft = "back" | "close" | "none";

interface Props {
  title?: React.ReactNode; // 제목 (텍스트 또는 JSX)
  left?: HeaderLeft;
  right?: React.ReactNode; // 우측 슬롯(공유, 메뉴 버튼 등 자유롭게)
  onLeftClick?: () => void; // 좌측 버튼 커스텀 동작 (없으면 router.back())
  centered?: boolean; // 제목 중앙정렬 여부
  transparent?: boolean; // 배경 투명 여부 (이미지 위에 헤더 띄울 때)
  bordered?: boolean; // 하단 구분선 표시
}

// 페이지별 좌측 버튼/우측 액션을 props 로 주입받는 식으로 사용한다
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

  // 좌측 버튼 클릭 처리: 커스텀 핸들러가 있으면 그것 우선, 없으면 브라우저 뒤로가기
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
        // 살짝 글래시한 헤더 — 스크롤 영역과 분리감 + 모던 톤
        background: transparent
          ? "transparent"
          : `linear-gradient(180deg, ${palette.surface} 0%, ${palette.surface}F2 100%)`,
        backdropFilter: transparent ? "none" : "saturate(160%) blur(8px)",
        WebkitBackdropFilter: transparent ? "none" : "saturate(160%) blur(8px)",
        zIndex: 2,
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
          fontWeight: 800,
          fontSize: 16,
          letterSpacing: "-0.02em",
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
