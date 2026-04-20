"use client";

import { Box, Button, IconButton, Stack, Typography } from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { palette } from "@/lib/theme";
import { useToast } from "@/components/ui/ToastProvider";
import { fetchBook, fetchOrder, type BookDetail, type OrderRow } from "@/lib/repo";

function CompleteInner({ bookId }: { bookId: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const orderId = params.get("orderId") ?? undefined;
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [book, setBook] = useState<BookDetail | null>(null);

  useEffect(() => {
    if (orderId) fetchOrder(orderId).then(setOrder);
    fetchBook(bookId).then(setBook);
  }, [orderId, bookId]);

  const orderNo = orderId ?? "ORD-PENDING";
  const amount = order?.price ?? book?.price ?? "-";

  const info = [
    { l: "주문번호", v: orderNo, copy: true },
    { l: "결제금액", v: amount },
    { l: "결제수단", v: "카카오페이" },
    { l: "배송지", v: "서울 마포구 합정동" },
  ];

  return (
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
          {book?.free ? "신청이 완료됐어요!" : "결제가 완료됐어요!"}
        </Typography>
        <Typography
          sx={{
            fontSize: 13.5,
            color: palette.inkMute,
            mt: 1,
            lineHeight: 1.6,
          }}
        >
          판매자에게 알림이 갔어요.
          <br />
          물건을 받으면 마이페이지에서 거래 확정을 눌러주세요.
        </Typography>
      </Box>

      <Box
        sx={{
          mx: 2,
          background: palette.surface,
          borderRadius: 3,
          border: `1px solid ${palette.line}`,
          p: 2,
        }}
      >
        <Typography
          sx={{
            fontSize: 12.5,
            fontWeight: 800,
            color: palette.inkMute,
            mb: 1,
          }}
        >
          주문 정보
        </Typography>
        {info.map((it) => (
          <Stack
            key={it.l}
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ py: 0.6 }}
          >
            <Typography sx={{ fontSize: 12.5, color: palette.inkSubtle }}>
              {it.l}
            </Typography>
            <Stack direction="row" gap={0.5} alignItems="center">
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                {it.v}
              </Typography>
              {it.copy && (
                <IconButton
                  size="small"
                  onClick={() => {
                    navigator.clipboard?.writeText(it.v);
                    toast?.show("주문번호를 복사했어요");
                  }}
                >
                  <ContentCopyRoundedIcon sx={{ fontSize: 16 }} />
                </IconButton>
              )}
            </Stack>
          </Stack>
        ))}
      </Box>

      <Box sx={{ px: 2, mt: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<IosShareRoundedIcon />}
          onClick={() => toast?.show("주문 정보 링크를 복사했어요")}
        >
          주문 공유하기
        </Button>
      </Box>

      <Box sx={{ flex: 1 }} />
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
            onClick={() => router.push(`/chat/${bookId}`)}
          >
            판매자와 채팅
          </Button>
          <Button
            sx={{ flex: 1.4 }}
            onClick={() => router.push("/mypage/orders")}
          >
            주문 내역 보기
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}

export default function CheckoutCompletePage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <Suspense fallback={null}>
      <CompleteInner bookId={params.id} />
    </Suspense>
  );
}
