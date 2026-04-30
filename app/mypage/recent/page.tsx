"use client";

// 최근 본 책 (/mypage/recent)
// - recentlyViewedStore (localStorage persist) 의 bookId 배열을 입력 순서대로 fetch
// - 사라진 책(HIDDEN/삭제) 은 결과에서 자연스럽게 빠진다 — 이때 store 의 stale id 도 함께 정리
// - "전체 삭제" 액션 — store.clear()

import { Box, Button, Stack, Typography } from "@mui/material";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import AppHeader from "@/components/ui/AppHeader";
import { ScrollBody } from "@/components/ui/Section";
import { BookGridCard } from "@/components/ui/BookCard";
import EmptyState from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useBooksByIds } from "@/lib/query/bookHooks";
import { useRecentlyViewedStore } from "@/lib/store/recentlyViewedStore";
import { palette } from "@/lib/theme";
import { useToast } from "@/components/ui/ToastProvider";

export default function RecentBooksPage() {
  const router = useRouter();
  const toast = useToast();
  // 별개 셀렉터로 구독 — 액션 함수가 객체일 때 매 렌더 새 참조 받지 않도록 분리
  const items = useRecentlyViewedStore((s) => s.items);
  const clear = useRecentlyViewedStore((s) => s.clear);
  const remove = useRecentlyViewedStore((s) => s.remove);

  // ids 배열은 items 가 바뀔 때만 새로 만든다 (useBooksByIds 의 query key 안정화)
  const ids = useMemo(() => items.map((it) => it.bookId), [items]);
  const { data: books, isLoading } = useBooksByIds(ids);

  // 결과에 없는 (= HIDDEN/삭제된) id 는 store 에서도 정리 — 다음 진입 시 깨끗한 상태 유지
  useEffect(() => {
    if (!books || ids.length === 0) return;
    const present = new Set(books.map((b) => b.id));
    const missing = ids.filter((id) => !present.has(id));
    if (missing.length > 0) missing.forEach(remove);
  }, [books, ids, remove]);

  const handleClear = () => {
    clear();
    toast?.show("최근 본 기록을 모두 지웠어요");
  };

  return (
    <>
      <AppHeader
        title="최근 본 책"
        left="back"
        right={
          items.length > 0 ? (
            <Button
              size="small"
              onClick={handleClear}
              sx={{ fontSize: 12.5, color: palette.inkSubtle, fontWeight: 700 }}
            >
              전체 삭제
            </Button>
          ) : null
        }
      />
      <ScrollBody>
        {isLoading && ids.length > 0 && <ListSkeleton count={4} />}
        {ids.length === 0 && (
          <EmptyState
            icon={<HistoryRoundedIcon />}
            title="아직 본 책이 없어요"
            description="관심 있는 책을 둘러보면 여기에 모아드려요."
            actionLabel="책 둘러보기"
            onAction={() => router.push("/home")}
          />
        )}
        {books && books.length > 0 && (
          <>
            <Stack
              direction="row"
              alignItems="center"
              sx={{ px: 2, pt: 1.5, pb: 0.5 }}
            >
              <Typography sx={{ fontSize: 12.5, color: palette.inkSubtle }}>
                총 {books.length}권
              </Typography>
            </Stack>
            <Box
              sx={{
                p: 2,
                pt: 1,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 1.25,
              }}
            >
              {books.map((b) => (
                <BookGridCard key={b.id} book={b} />
              ))}
            </Box>
          </>
        )}
      </ScrollBody>
    </>
  );
}
