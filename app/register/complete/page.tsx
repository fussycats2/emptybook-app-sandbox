"use client";

// 도서 등록 완료 페이지 (/register/complete?id=xxx)
// 등록한 책 요약 카드 + "거래를 잘하는 팁" + 홈/등록한 책으로 이동 버튼

import { Box, Button, Stack, Typography } from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
import LightbulbRoundedIcon from "@mui/icons-material/LightbulbRounded";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import BookImage from "@/components/ui/BookImage";
import { palette } from "@/lib/theme";
import { useToast } from "@/components/ui/ToastProvider";
import { useBook } from "@/lib/query/bookHooks";

const TIPS = [
  { icon: "📸", title: "사진을 추가해보세요", desc: "사진이 5장 이상이면 채팅 응답률이 1.7배 늘어요." },
  { icon: "💬", title: "빠른 응답이 거래의 시작", desc: "10분 이내 답하면 거래 확률이 두 배 높아져요." },
  { icon: "💸", title: "비슷한 책 평균가 참고", desc: "비슷한 책의 시세를 한 번 더 살펴보세요." },
];

// 실제 화면 본체. useSearchParams 를 쓰기 위해 Suspense 안에서만 동작
function CompleteInner() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const id = params.get("id") ?? undefined;
  // React Query — 방금 등록한 책 정보 (createBook 의 onSuccess 가 cache 무효화 했음)
  const { data: book } = useBook(id);

  return (
    <>
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: palette.bg,
          overflowY: "auto",
        }}
      >
        <Box
          sx={{
            background: `radial-gradient(120% 80% at 50% 0%, ${palette.primarySoft} 0%, ${palette.primaryTint} 50%, ${palette.bg} 100%)`,
            pt: 8,
            pb: 5,
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
                "radial-gradient(circle at 80% 20%, rgba(45,95,74,0.08) 0%, transparent 40%), radial-gradient(circle at 20% 80%, rgba(45,95,74,0.06) 0%, transparent 40%)",
              pointerEvents: "none",
            }}
          />
          <Box
            className="scale-in"
            sx={{
              position: "relative",
              width: 88,
              height: 88,
              borderRadius: "50%",
              background: `linear-gradient(155deg, ${palette.primary} 0%, ${palette.primaryDark} 100%)`,
              color: "#fff",
              display: "grid",
              placeItems: "center",
              mx: "auto",
              boxShadow: "0 16px 40px rgba(45,95,74,0.30), 0 4px 12px rgba(45,95,74,0.20)",
            }}
          >
            <CheckRoundedIcon sx={{ fontSize: 48 }} />
          </Box>
          <Typography
            sx={{
              fontSize: 24,
              fontWeight: 800,
              mt: 3,
              letterSpacing: "-0.025em",
              position: "relative",
            }}
          >
            등록이 완료됐어요!
          </Typography>
          <Typography
            sx={{
              fontSize: 14,
              color: palette.inkMute,
              mt: 1,
              lineHeight: 1.65,
              position: "relative",
            }}
          >
            {book?.region ?? "동네"}의 이웃들이 곧 살펴볼 거예요.
          </Typography>
        </Box>

        <Box sx={{ p: 2 }}>
          <Box
            onClick={() => book && router.push(`/books/${book.id}`)}
            sx={{
              borderRadius: 3,
              background: palette.surface,
              border: `1px solid ${palette.line}`,
              p: 1.5,
              display: "flex",
              gap: 1.5,
              cursor: book ? "pointer" : "default",
            }}
          >
            <BookImage seed={book?.id ?? "complete"} width={68} height={88} radius={10} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 800 }}>
                {book?.title ?? "도서"}
              </Typography>
              <Typography sx={{ fontSize: 12, color: palette.inkSubtle }}>
                {book?.author ?? "-"} · 상태 {book?.state ?? "-"}
              </Typography>
              <Typography sx={{ fontSize: 16, fontWeight: 800, mt: 0.5 }}>
                {book?.price ?? ""}
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              startIcon={<IosShareRoundedIcon />}
              sx={{ alignSelf: "flex-start" }}
              onClick={(e) => {
                e.stopPropagation();
                toast?.show("링크를 복사했어요");
              }}
            >
              공유
            </Button>
          </Box>
        </Box>

        <Box sx={{ px: 2, pb: 3 }}>
          <Stack direction="row" gap={0.75} alignItems="center" mb={1}>
            <LightbulbRoundedIcon sx={{ color: "#E0A526", fontSize: 18 }} />
            <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
              거래를 잘하는 팁
            </Typography>
          </Stack>
          <Stack gap={1}>
            {TIPS.map((t) => (
              <Box
                key={t.title}
                sx={{
                  background: palette.surface,
                  border: `1px solid ${palette.line}`,
                  borderRadius: 3,
                  p: 1.5,
                  display: "flex",
                  gap: 1.5,
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    background: palette.lineSoft,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 18,
                  }}
                >
                  {t.icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 800 }}>
                    {t.title}
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, color: palette.inkMute }}>
                    {t.desc}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>
      </Box>
      <Box
        className="safe-bottom"
        sx={{
          p: 2,
          borderTop: `1px solid ${palette.line}`,
          background: palette.surface,
          flexShrink: 0,
        }}
      >
        <Stack direction="row" gap={1}>
          <Button
            variant="outlined"
            sx={{ flex: 1 }}
            onClick={() => router.push("/home")}
          >
            홈으로
          </Button>
          <Button
            sx={{ flex: 1.4 }}
            onClick={() => (book ? router.push(`/books/${book.id}`) : router.push("/home"))}
          >
            등록한 책 보기
          </Button>
        </Stack>
      </Box>
    </>
  );
}

export default function RegisterCompletePage() {
  return (
    <Suspense fallback={null}>
      <CompleteInner />
    </Suspense>
  );
}
