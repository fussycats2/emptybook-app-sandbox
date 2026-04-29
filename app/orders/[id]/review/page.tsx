"use client";

// 거래 후기 작성 페이지 (/orders/[id]/review)
// - [id] 는 transactions.id (거래 ID)
// - 마운트 시 fetchReviewContext 로 상대방/책/거래일/이미 작성 여부 조회
// - 이미 작성된 거래면 입력을 잠그고 안내 문구 표시
// - 별점(1~5) + 좋았던 점 태그(다중) + 상세 후기(선택) 후 createReview 호출

import { Box, Button, Chip, Stack, TextField, Typography } from "@mui/material";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AppHeader from "@/components/ui/AppHeader";
import { ScrollBody, FixedFooter } from "@/components/ui/Section";
import BookImage from "@/components/ui/BookImage";
import { palette } from "@/lib/theme";
import { useToast } from "@/components/ui/ToastProvider";
import { useCreateReview, useReviewContext } from "@/lib/query/reviewHooks";

const TAGS = [
  "도서 상태가 좋아요",
  "응답이 빨라요",
  "친절해요",
  "설명이 정확해요",
  "약속을 잘 지켜요",
  "포장이 꼼꼼해요",
];
const RATING_TEXT = ["별로예요", "그저 그래요", "괜찮아요", "좋아요!", "최고예요!"];

export default function ReviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState("");
  // React Query — 거래 컨텍스트 + 후기 작성 mutation
  const { data: ctx, isLoading: loading } = useReviewContext(params.id);
  const createReviewMutation = useCreateReview();
  const submitting = createReviewMutation.isPending;

  // 다중 선택 태그 토글 헬퍼
  const toggleTag = (t: string) =>
    setTags((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  // 마우스 호버 시 미리보기 별점, 호버가 없으면 실제 선택값을 표시
  const display = hover || rating;

  // 작성 잠금 조건: 컨텍스트 없음(거래 당사자가 아님) 또는 이미 작성한 거래
  const locked = !ctx || ctx.alreadyReviewed;

  const submit = async () => {
    if (!ctx || submitting || rating === 0) return;
    try {
      const res = await createReviewMutation.mutateAsync({
        transactionId: params.id,
        revieweeId: ctx.revieweeId,
        rating,
        tags,
        comment: text.trim() || undefined,
      });
      if (res.alreadyExists) {
        toast?.show("이미 후기를 작성한 거래예요");
      } else {
        toast?.show("소중한 후기를 남겨주셔서 감사해요!");
      }
      router.push("/mypage");
    } catch {
      toast?.show("후기 저장에 실패했어요. 잠시 후 다시 시도해주세요.", "error");
    }
  };

  return (
    <>
      <AppHeader title="거래 후기 남기기" left="back" />
      <ScrollBody>
        <Box sx={{ p: 2.5, textAlign: "center" }}>
          <Stack direction="row" gap={1.25} alignItems="center" justifyContent="center" mb={2}>
            <BookImage seed={ctx?.revieweeId ?? "reviewee"} width={40} height={40} radius={999} />
            <Box sx={{ textAlign: "left" }}>
              <Typography sx={{ fontSize: 14.5, fontWeight: 800 }}>
                {ctx?.revieweeName ?? (loading ? "불러오는 중…" : "상대방")}
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: palette.inkSubtle }}>
                {ctx ? `${ctx.bookTitle} · ${ctx.completedAt}` : ""}
              </Typography>
            </Box>
          </Stack>

          {ctx?.alreadyReviewed && (
            <Box
              sx={{
                background: palette.primarySoft,
                color: palette.primary,
                borderRadius: 2,
                px: 1.5,
                py: 1,
                fontSize: 12.5,
                fontWeight: 700,
                mb: 2,
              }}
            >
              이미 후기를 작성한 거래예요
            </Box>
          )}

          <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2 }}>
            거래는 어떠셨나요?
          </Typography>
          <Stack direction="row" gap={0.5} justifyContent="center">
            {[1, 2, 3, 4, 5].map((i) => (
              <Box
                key={i}
                onClick={() => !locked && setRating(i)}
                onMouseEnter={() => !locked && setHover(i)}
                onMouseLeave={() => setHover(0)}
                sx={{ cursor: locked ? "default" : "pointer", p: 0.5, opacity: locked ? 0.5 : 1 }}
              >
                <StarRoundedIcon
                  className={display >= i ? "animate-pop" : undefined}
                  sx={{
                    fontSize: 44,
                    color: display >= i ? "#FFC53D" : palette.lineSoft,
                    transition: "color 100ms",
                  }}
                />
              </Box>
            ))}
          </Stack>
          <Typography
            sx={{
              fontSize: 13,
              color: palette.inkMute,
              mt: 1.5,
              minHeight: 22,
              fontWeight: 700,
            }}
          >
            {display > 0 ? RATING_TEXT[display - 1] : ""}
          </Typography>
        </Box>

        <Box sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" mb={1}>
            <Typography sx={{ fontSize: 13.5, fontWeight: 800 }}>좋았던 점</Typography>
            <Typography sx={{ fontSize: 12, color: palette.inkSubtle }}>
              {tags.length}개 선택
            </Typography>
          </Stack>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {TAGS.map((t) => {
              const on = tags.includes(t);
              return (
                <Chip
                  key={t}
                  label={t}
                  variant={on ? "filled" : "outlined"}
                  onClick={() => !locked && toggleTag(t)}
                  disabled={locked}
                  sx={{
                    height: 36,
                    px: 1,
                    fontSize: 13,
                    ...(on && {
                      background: palette.primary,
                      color: "#fff",
                    }),
                  }}
                />
              );
            })}
          </Box>
        </Box>

        <Box sx={{ p: 2 }}>
          <Typography sx={{ fontSize: 13.5, fontWeight: 800, mb: 1 }}>
            상세 후기 (선택)
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={4}
            placeholder="다른 사용자들에게 도움이 될 후기를 남겨주세요. (최대 200자)"
            value={text}
            disabled={locked}
            onChange={(e) => setText(e.target.value.slice(0, 200))}
          />
          <Typography sx={{ textAlign: "right", fontSize: 11, color: palette.inkSubtle, mt: 0.5 }}>
            {text.length}/200
          </Typography>
        </Box>
      </ScrollBody>
      <FixedFooter>
        <Button
          fullWidth
          disabled={locked || rating === 0 || submitting}
          onClick={submit}
        >
          {submitting ? "보내는 중…" : ctx?.alreadyReviewed ? "이미 작성됨" : "후기 보내기"}
        </Button>
      </FixedFooter>
    </>
  );
}
