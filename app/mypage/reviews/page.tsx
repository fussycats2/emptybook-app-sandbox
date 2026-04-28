"use client";

// 받은 후기 (/mypage/reviews)
// - listReceivedReviews 결과를 별점/태그/코멘트 카드 형태로 표시
// - 상단에 평균 별점 + 후기 개수 요약
// - 비어있으면 EmptyState

import { Box, Chip, Stack, Typography } from "@mui/material";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import StarOutlineRoundedIcon from "@mui/icons-material/StarOutlineRounded";
import { useEffect, useState } from "react";
import AppHeader from "@/components/ui/AppHeader";
import { ScrollBody } from "@/components/ui/Section";
import EmptyState from "@/components/ui/EmptyState";
import BookImage from "@/components/ui/BookImage";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { listReceivedReviews, type ReceivedReview } from "@/lib/repo";
import { palette } from "@/lib/theme";

export default function MyReviewsPage() {
  const [reviews, setReviews] = useState<ReceivedReview[] | null>(null);

  useEffect(() => {
    listReceivedReviews()
      .then(setReviews)
      .catch(() => setReviews([]));
  }, []);

  // 평균 별점 — 후기 0개면 0.0 으로 표시
  const avg =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <>
      <AppHeader title="받은 후기" left="back" />
      <ScrollBody>
        {!reviews && <ListSkeleton count={3} />}
        {reviews && reviews.length === 0 && (
          <EmptyState
            icon={<StarOutlineRoundedIcon />}
            title="아직 받은 후기가 없어요"
            description="거래가 완료되면 상대방이 후기를 남길 수 있어요."
          />
        )}
        {reviews && reviews.length > 0 && (
          <>
            <Box sx={{ p: 2 }}>
              <Box
                sx={{
                  background: palette.surface,
                  border: `1px solid ${palette.line}`,
                  borderRadius: 3,
                  p: 2,
                  textAlign: "center",
                }}
              >
                <Typography sx={{ fontSize: 11.5, color: palette.inkSubtle }}>
                  평균 별점
                </Typography>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="center"
                  gap={0.5}
                  mt={0.5}
                >
                  <StarRoundedIcon sx={{ color: "#FFC53D", fontSize: 28 }} />
                  <Typography sx={{ fontSize: 26, fontWeight: 800 }}>
                    {avg.toFixed(1)}
                  </Typography>
                </Stack>
                <Typography sx={{ fontSize: 12, color: palette.inkMute, mt: 0.5 }}>
                  후기 {reviews.length}개
                </Typography>
              </Box>
            </Box>

            <Stack gap={1} sx={{ px: 2, pb: 3 }}>
              {reviews.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </Stack>
          </>
        )}
      </ScrollBody>
    </>
  );
}

function ReviewCard({ review }: { review: ReceivedReview }) {
  const date = formatDate(review.createdAt);
  return (
    <Box
      sx={{
        background: palette.surface,
        border: `1px solid ${palette.line}`,
        borderRadius: 3,
        p: 1.75,
      }}
    >
      <Stack direction="row" gap={1.25} alignItems="center">
        <BookImage seed={review.reviewerSeed} width={36} height={36} radius={999} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 13.5, fontWeight: 800 }}>
            {review.reviewerName}
          </Typography>
          <Typography
            sx={{ fontSize: 11.5, color: palette.inkSubtle }}
            noWrap
          >
            {review.bookTitle} · {date}
          </Typography>
        </Box>
        <Stack direction="row" alignItems="center" gap={0.25}>
          <StarRoundedIcon sx={{ color: "#FFC53D", fontSize: 18 }} />
          <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>
            {review.rating}
          </Typography>
        </Stack>
      </Stack>

      {review.tags.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1.25 }}>
          {review.tags.map((t) => (
            <Chip
              key={t}
              label={t}
              size="small"
              sx={{
                height: 24,
                fontSize: 11.5,
                background: palette.primarySoft,
                color: palette.primary,
                fontWeight: 700,
              }}
            />
          ))}
        </Box>
      )}

      {review.comment && (
        <Typography
          sx={{
            fontSize: 13,
            color: palette.inkMute,
            mt: 1.25,
            lineHeight: 1.55,
            whiteSpace: "pre-wrap",
          }}
        >
          {review.comment}
        </Typography>
      )}
    </Box>
  );
}

// ISO 문자열 → "2024.01.12" 형태. 잘못된 값이면 원본 그대로 반환
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ko-KR");
}
