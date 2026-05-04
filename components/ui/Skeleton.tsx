"use client";

// 데이터 로딩 중 회색 박스 + 반짝이는 애니메이션을 보여주는 스켈레톤
// (실제 콘텐츠가 들어올 자리를 같은 모양/크기로 미리 잡아 화면 떨림 방지)
// 'skeleton' 클래스의 셰이머 효과는 globals.css에서 정의됨

import { Box, Stack } from "@mui/material";

// 단일 막대형 스켈레톤 — 글자 한 줄, 칩, 작은 박스 등 어디든 사용
export function SkeletonBox({
  width = "100%",
  height = 12,
  radius = 8,
  sx,
}: {
  width?: number | string;
  height?: number | string;
  radius?: number;
  sx?: any;
}) {
  return (
    <Box
      className="skeleton"
      sx={{ width, height, borderRadius: `${radius}px`, ...sx }}
    />
  );
}

// BookFeedItem 모양에 맞춘 스켈레톤
export function BookCardSkeleton() {
  return (
    <Stack direction="row" gap={1.75} sx={{ py: 2, px: 2 }}>
      <SkeletonBox width={108} height={132} radius={14} />
      <Stack flex={1} gap={1.1} pt={0.5}>
        <SkeletonBox width="70%" height={15} />
        <SkeletonBox width="42%" height={11} />
        <Stack flex={1} />
        <SkeletonBox width="55%" height={20} radius={6} />
        <SkeletonBox width="30%" height={11} />
      </Stack>
    </Stack>
  );
}

// 카드 스켈레톤을 count 개수만큼 세로로 나열 — 목록형 화면 로딩 상태에 사용
export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Stack>
      {Array.from({ length: count }).map((_, i) => (
        <BookCardSkeleton key={i} />
      ))}
    </Stack>
  );
}
