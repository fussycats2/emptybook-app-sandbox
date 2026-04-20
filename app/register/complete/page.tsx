"use client";

import { Box, Button, Stack, Typography } from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
import LightbulbRoundedIcon from "@mui/icons-material/LightbulbRounded";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import BookImage from "@/components/ui/BookImage";
import { palette } from "@/lib/theme";
import { useToast } from "@/components/ui/ToastProvider";
import { fetchBook, type BookDetail } from "@/lib/repo";

const TIPS = [
  { icon: "📸", title: "사진을 추가해보세요", desc: "사진이 5장 이상이면 채팅 응답률이 1.7배 늘어요." },
  { icon: "💬", title: "빠른 응답이 거래의 시작", desc: "10분 이내 답하면 거래 확률이 두 배 높아져요." },
  { icon: "💸", title: "비슷한 책 평균가 참고", desc: "비슷한 책의 시세를 한 번 더 살펴보세요." },
];

function CompleteInner() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const id = params.get("id") ?? undefined;
  const [book, setBook] = useState<BookDetail | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchBook(id).then(setBook);
  }, [id]);

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
            background: `linear-gradient(180deg, ${palette.primarySoft} 0%, ${palette.bg} 100%)`,
            pt: 7,
            pb: 4,
            textAlign: "center",
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: palette.primary,
              color: "#fff",
              display: "grid",
              placeItems: "center",
              mx: "auto",
              boxShadow: "0 12px 24px rgba(31,111,78,0.25)",
            }}
          >
            <CheckRoundedIcon sx={{ fontSize: 44 }} />
          </Box>
          <Typography sx={{ fontSize: 22, fontWeight: 800, mt: 2.5 }}>
            등록이 완료됐어요!
          </Typography>
          <Typography sx={{ fontSize: 13.5, color: palette.inkMute, mt: 1, lineHeight: 1.6 }}>
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
