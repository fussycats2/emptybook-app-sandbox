"use client";

// 내가 등록한 책 목록 (/mypage/selling)
// - 상태별(전체/판매중/예약중/판매완료) 칩 필터
// - 비어있으면 EmptyState + "책 등록하기" 진입점

import { Box, Chip, Stack } from "@mui/material";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import AppHeader from "@/components/ui/AppHeader";
import { ScrollBody } from "@/components/ui/Section";
import { BookListRow } from "@/components/ui/BookCard";
import EmptyState from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useMyBooks } from "@/lib/query/bookHooks";
import { palette } from "@/lib/theme";

// 칩 라벨 ↔ BookSummary.status (UI status) 매핑
// "취소됨" 은 판매 취소된(=DB books.status="HIDDEN") 책 — 공개 목록에서는 빠지지만 본인은 볼 수 있어야 함
const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "selling", label: "판매중" },
  { key: "reserved", label: "예약중" },
  { key: "sold", label: "판매완료" },
  { key: "canceled", label: "취소됨" },
];

export default function SellingPage() {
  const router = useRouter();
  const { data: books, isLoading } = useMyBooks();
  const [filter, setFilter] = useState("all");

  // 무료나눔(status=free)도 "판매중"으로 묶어 노출
  const filtered = useMemo(() => {
    if (!books) return null;
    if (filter === "all") return books;
    return books.filter((b) => {
      const s = b.status ?? (b.free ? "free" : "selling");
      if (filter === "selling") return s === "selling" || s === "free";
      return s === filter;
    });
  }, [books, filter]);

  return (
    <>
      <AppHeader title="판매 내역" left="back" />
      <Box
        sx={{
          background: palette.surface,
          borderBottom: `1px solid ${palette.line}`,
          flexShrink: 0,
        }}
      >
        <Stack
          direction="row"
          gap={0.75}
          className="no-scrollbar"
          sx={{ overflowX: "auto", px: 2, py: 1 }}
        >
          {FILTERS.map((f) => {
            const on = filter === f.key;
            return (
              <Chip
                key={f.key}
                label={f.label}
                size="small"
                onClick={() => setFilter(f.key)}
                variant={on ? "filled" : "outlined"}
                sx={{
                  flexShrink: 0,
                  ...(on && { background: palette.ink, color: "#fff" }),
                }}
              />
            );
          })}
        </Stack>
      </Box>

      <ScrollBody>
        {isLoading && <ListSkeleton count={4} />}
        {filtered && filtered.length === 0 && (
          <EmptyState
            icon={<StorefrontRoundedIcon />}
            title="등록한 책이 없어요"
            description="내 책장의 책을 등록해 첫 판매를 시작해보세요."
            actionLabel="책 등록하기"
            onAction={() => router.push("/register")}
          />
        )}
        {filtered && filtered.length > 0 && (
          <Box sx={{ background: palette.surface }}>
            {filtered.map((b) => (
              <BookListRow key={b.id} book={b} />
            ))}
          </Box>
        )}
      </ScrollBody>
    </>
  );
}
