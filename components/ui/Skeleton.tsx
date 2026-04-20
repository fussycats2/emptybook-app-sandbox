"use client";

import { Box, Stack } from "@mui/material";

export function SkeletonBox({
  width = "100%",
  height = 12,
  radius = 6,
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

export function BookCardSkeleton() {
  return (
    <Stack direction="row" gap={1.5} sx={{ p: 2 }}>
      <SkeletonBox width={92} height={120} radius={12} />
      <Stack flex={1} gap={1.25} pt={0.5}>
        <SkeletonBox width="70%" height={14} />
        <SkeletonBox width="40%" height={12} />
        <SkeletonBox width="50%" height={18} />
        <SkeletonBox width="30%" height={10} />
      </Stack>
    </Stack>
  );
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Stack divider={<Box sx={{ height: 1 }} />}>
      {Array.from({ length: count }).map((_, i) => (
        <BookCardSkeleton key={i} />
      ))}
    </Stack>
  );
}
