"use client";

// 내가 등록한 책 목록 (/mypage/selling)
// - 상태별(전체/판매중/예약중/판매완료) 칩 필터
// - 행 레이아웃은 /mypage/orders 와 동일 (BookImage autoWidth + 우측 StatusBadge)

import { Box, Chip, Stack, Typography } from "@mui/material";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import AppHeader from "@/components/ui/AppHeader";
import { ScrollBody } from "@/components/ui/Section";
import BookImage from "@/components/ui/BookImage";
import EmptyState from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import StatusBadge, { type SaleStatus } from "@/components/ui/StatusBadge";
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
            {filtered.map((b) => {
              const badge: SaleStatus = b.status ?? (b.free ? "free" : "selling");
              return (
                <Box
                  key={b.id}
                  onClick={() => router.push(`/books/${b.id}`)}
                  sx={{
                    display: "flex",
                    gap: 1.5,
                    p: "14px 16px",
                    borderBottom: `1px solid ${palette.lineSoft}`,
                    cursor: "pointer",
                    transition: "background 160ms ease",
                    "&:hover": { background: palette.surfaceAlt },
                  }}
                >
                  {/* /mypage/orders 와 동일 — autoWidth 로 표지 자연 비율 그대로 표시 */}
                  <BookImage
                    seed={b.id}
                    src={b.coverUrl}
                    height={88}
                    radius={0}
                    autoWidth
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: 14,
                        fontWeight: 700,
                        letterSpacing: "-0.02em",
                        display: "-webkit-box",
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {b.title}
                    </Typography>
                    <Typography
                      sx={{ fontSize: 11.5, color: palette.inkSubtle, mt: 0.25 }}
                    >
                      {b.author}
                      {b.publisher ? ` · ${b.publisher}` : ""}
                    </Typography>
                    <Stack direction="row" gap={0.75} mt={0.85} alignItems="center">
                      <Typography
                        sx={{
                          fontSize: 14.5,
                          fontWeight: 800,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {b.price}
                      </Typography>
                      <Box
                        sx={{
                          fontSize: 10.5,
                          border: `1px solid ${palette.line}`,
                          background: palette.lineSoft,
                          px: 0.85,
                          py: 0.25,
                          borderRadius: 999,
                          color: palette.inkMute,
                          fontWeight: 700,
                        }}
                      >
                        {b.state}
                      </Box>
                    </Stack>
                    {(b.loc || b.date) && (
                      <Typography
                        sx={{ fontSize: 11, color: palette.inkSubtle, mt: 0.5 }}
                      >
                        {[b.loc, b.date].filter(Boolean).join(" · ")}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ alignSelf: "flex-start" }}>
                    <StatusBadge status={badge} size="sm" />
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </ScrollBody>
    </>
  );
}
