"use client";

// 받은 후기 (/mypage/reviews)
// - listReceivedReviews 결과를 별점/태그/코멘트 카드 형태로 표시
// - 상단에 평균 별점 + 후기 개수 요약
// - 비어있으면 EmptyState

import { Box, Chip, Stack, Typography } from "@mui/material";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import StarOutlineRoundedIcon from "@mui/icons-material/StarOutlineRounded";
import AppHeader from "@/components/ui/AppHeader";
import { ScrollBody } from "@/components/ui/Section";
import EmptyState from "@/components/ui/EmptyState";
import BookImage from "@/components/ui/BookImage";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { type ReceivedReview } from "@/lib/repo";
import { useReceivedReviews } from "@/lib/query/profileHooks";
import { palette } from "@/lib/theme";

export default function MyReviewsPage() {
  const { data: reviews, isLoading } = useReceivedReviews();

  // 평균 별점 — 후기 0개면 0.0 으로 표시
  const avg =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <>
      <AppHeader title="받은 후기" left="back" />
      <ScrollBody>
        {isLoading && <ListSkeleton count={3} />}
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
                  background: `linear-gradient(135deg, ${palette.surface} 0%, ${palette.surfaceAlt} 100%)`,
                  border: `1px solid ${palette.lineSoft}`,
                  borderRadius: 3,
                  p: 2.5,
                  textAlign: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "radial-gradient(circle at 70% 20%, rgba(255, 197, 61, 0.15) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(45,95,74,0.06) 0%, transparent 50%)",
                    pointerEvents: "none",
                  }}
                />
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    color: palette.inkSubtle,
                    position: "relative",
                  }}
                >
                  AVERAGE RATING
                </Typography>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="center"
                  gap={0.75}
                  mt={1}
                  sx={{ position: "relative" }}
                >
                  <StarRoundedIcon sx={{ color: "#FFC53D", fontSize: 32 }} />
                  <Typography
                    sx={{
                      fontSize: 32,
                      fontWeight: 800,
                      letterSpacing: "-0.03em",
                      lineHeight: 1,
                    }}
                  >
                    {avg.toFixed(1)}
                  </Typography>
                </Stack>
                <Typography
                  sx={{
                    fontSize: 12,
                    color: palette.inkMute,
                    mt: 1,
                    fontWeight: 600,
                    position: "relative",
                  }}
                >
                  후기 {reviews.length}개를 받았어요
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
