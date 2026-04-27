"use client";

// 페이지 골격을 만들 때 자주 쓰는 3가지 레이아웃 헬퍼
// - SectionLabel: 작은 섹션 제목(좌) + 우측 액션(우) 한 줄
// - ScrollBody: 페이지 본문 스크롤 영역 (헤더/푸터 사이의 가운데)
// - FixedFooter: 화면 하단에 고정되는 액션 바 (결제 버튼 등)

import { Box } from "@mui/material";
import { palette, shadow } from "@/lib/theme";

// "최근 등록" 같은 섹션 머리말 + 우측 "더보기" 같은 보조 텍스트 슬롯
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

// 페이지 가운데 스크롤 영역. flex:1 로 남는 공간을 차지하며 세로 스크롤만 허용
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

// 결제/등록/거래확정 등 한 줄짜리 액션 버튼이 들어가는 하단 고정 바
// safe-bottom 클래스: iOS 홈바 영역(safe area) 만큼 padding 확보
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
        zIndex: 5,
      }}
    >
      {children}
    </Box>
  );
}
