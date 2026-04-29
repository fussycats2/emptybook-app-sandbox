"use client";

// 내가 찜한 책 목록 (/mypage/likes)
// - listLikedBooks 결과를 2열 그리드(BookGridCard)로 표시
// - 비어있으면 EmptyState + "책 둘러보기"

import { Box } from "@mui/material";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/ui/AppHeader";
import { ScrollBody } from "@/components/ui/Section";
import { BookGridCard } from "@/components/ui/BookCard";
import EmptyState from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useLikedBooks } from "@/lib/query/likeHooks";

export default function LikesPage() {
  const router = useRouter();
  // React Query — 다른 화면에서 토글하면 invalidate 되어 자동 refetch
  const { data: books, isLoading } = useLikedBooks();

  return (
    <>
      <AppHeader title="찜한 책" left="back" />
      <ScrollBody>
        {isLoading && <ListSkeleton count={4} />}
        {books && books.length === 0 && (
          <EmptyState
            icon={<FavoriteBorderRoundedIcon />}
            title="찜한 책이 없어요"
            description="마음에 드는 책에 하트를 눌러 모아보세요."
            actionLabel="책 둘러보기"
            onAction={() => router.push("/home")}
          />
        )}
        {books && books.length > 0 && (
          <Box
            sx={{
              p: 2,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 1.25,
            }}
          >
            {books.map((b) => (
              <BookGridCard key={b.id} book={b} />
            ))}
          </Box>
        )}
      </ScrollBody>
    </>
  );
}
