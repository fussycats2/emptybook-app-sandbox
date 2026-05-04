"use client";

// 거래 확정 페이지 (/orders/[id])
// - 운송장 정보 + 배송 단계 트래커 + 수령 인증 사진 슬롯
// - "거래 확정하기" 클릭 시 ConfirmDialog 로 한 번 더 확인
// - 확정되면 completeOrder() 호출 후 후기 작성 화면으로 이동
// TODO: 운송장/배송 단계는 현재 더미 데이터(STEPS) 기반. 외부 배송사 API 연동 필요

import {
  Box,
  Button,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import AddPhotoAlternateRoundedIcon from "@mui/icons-material/AddPhotoAlternateRounded";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AppHeader from "@/components/ui/AppHeader";
import { ScrollBody, FixedFooter } from "@/components/ui/Section";
import BookImage from "@/components/ui/BookImage";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { palette } from "@/lib/theme";
import { useToast } from "@/components/ui/ToastProvider";
import { useBook } from "@/lib/query/bookHooks";
import { useCompleteOrder, useOrder } from "@/lib/query/orderHooks";

const STEPS = [
  { step: "주문 완료", date: "01.16 10:00", done: true },
  { step: "발송 준비", date: "01.16 14:30", done: true },
  { step: "배송 중", date: "01.17 09:00", done: true },
  { step: "배송 완료", date: "01.17 14:20", done: true },
];

export default function OrderConfirmPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  // React Query — order 가 먼저 로드되면 그 안의 bookId 로 useBook 활성화 (의존 쿼리)
  const { data: order } = useOrder(params.id);
  const { data: book } = useBook(order?.bookId);
  const completeMutation = useCompleteOrder();

  const seedId = book?.id ?? order?.bookId ?? params.id;
  const title = book?.title ?? order?.title ?? "도서";
  const sellerName = book?.seller ?? "판매자";
  const purchaseDate = order?.date ?? "-";

  return (
    <>
      <AppHeader title="거래 확정" left="back" />
      <ScrollBody>
        <Box sx={{ background: palette.surface, p: 2, display: "flex", gap: 1.5 }}>
          <BookImage seed={seedId} width={64} height={84} radius={10} />
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 800 }}>{title}</Typography>
            <Typography sx={{ fontSize: 12, color: palette.inkSubtle }}>
              판매자 {sellerName}
            </Typography>
            <Typography sx={{ fontSize: 12, color: palette.inkSubtle, mt: 0.25 }}>
              구매일 {purchaseDate}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            mx: 2,
            mt: 2,
            background: palette.surface,
            border: `1px solid ${palette.line}`,
            borderRadius: 3,
            p: 1.5,
          }}
        >
          <Stack direction="row" alignItems="center" gap={1} mb={1.25}>
            <LocalShippingRoundedIcon sx={{ color: palette.primary }} />
            <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
              운송장 정보
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography sx={{ fontSize: 11.5, color: palette.inkSubtle }}>
                CJ 대한통운
              </Typography>
              <Stack direction="row" gap={0.5} alignItems="center">
                <Typography sx={{ fontSize: 16, fontWeight: 800 }}>
                  601234567890
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => {
                    navigator.clipboard?.writeText("601234567890");
                    toast?.show("운송장 번호를 복사했어요");
                  }}
                >
                  <ContentCopyRoundedIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Stack>
            </Box>
            <Button
              size="small"
              variant="outlined"
              endIcon={<OpenInNewRoundedIcon sx={{ fontSize: 14 }} />}
              onClick={() => toast?.show("운송장 추적 링크를 열어요")}
            >
              추적
            </Button>
          </Stack>
        </Box>

        <Box sx={{ p: 2 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 800, mb: 1.5 }}>
            배송 현황
          </Typography>
          <Box
            sx={{
              background: palette.surface,
              border: `1px solid ${palette.line}`,
              borderRadius: 3,
              p: 1.5,
            }}
          >
            {STEPS.map((s, i) => (
              <Stack key={s.step} direction="row" gap={1.5} alignItems="flex-start">
                <Stack alignItems="center">
                  <Box
                    sx={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: s.done ? palette.primary : palette.lineSoft,
                      color: "#fff",
                      display: "grid",
                      placeItems: "center",
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    {i + 1}
                  </Box>
                  {i < STEPS.length - 1 && (
                    <Box
                      sx={{
                        width: 2,
                        height: 32,
                        background: s.done ? palette.primary : palette.lineSoft,
                      }}
                    />
                  )}
                </Stack>
                <Box sx={{ pb: 2, flex: 1 }}>
                  <Typography
                    sx={{
                      fontSize: 13.5,
                      fontWeight: s.done ? 800 : 500,
                      color: s.done ? palette.ink : palette.inkSubtle,
                    }}
                  >
                    {s.step}
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, color: palette.inkSubtle }}>
                    {s.date}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Box>
        </Box>

        <Box sx={{ px: 2, pb: 2 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 800, mb: 1 }}>
            수령 인증 사진 (선택)
          </Typography>
          <Box
            sx={{
              border: `1.5px dashed ${palette.line}`,
              borderRadius: 3,
              background: palette.lineSoft,
              p: 3,
              display: "grid",
              placeItems: "center",
              color: palette.inkMute,
              cursor: "pointer",
            }}
            onClick={() => toast?.show("사진 업로드 준비 중")}
          >
            <Stack alignItems="center" gap={0.5}>
              <AddPhotoAlternateRoundedIcon sx={{ fontSize: 28 }} />
              <Typography sx={{ fontSize: 12 }}>
                안전 거래를 위해 수령 사진을 첨부해보세요
              </Typography>
            </Stack>
          </Box>
        </Box>

        <Box
          sx={{
            mx: 2,
            mb: 2,
            background: "#FFF7E6",
            borderRadius: 3,
            p: 1.5,
            color: "#7A5800",
            fontSize: 12.5,
            lineHeight: 1.55,
          }}
        >
          📦 책 상태를 꼭 확인하고 확정해주세요. 거래 확정 후에는 환불이 어려워요.
        </Box>
      </ScrollBody>
      <FixedFooter>
        <Stack direction="row" gap={1}>
          <Button variant="outlined" sx={{ flex: 1 }} onClick={() => toast?.show("신고가 접수됐어요")}>
            문제 신고
          </Button>
          <Button sx={{ flex: 1.5 }} onClick={() => setConfirm(true)}>
            거래 확정하기
          </Button>
        </Stack>
      </FixedFooter>
      <ConfirmDialog
        open={confirm}
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          setConfirm(false);
          // FSM 트리거(0010) 가 권한/상태 위반을 RAISE EXCEPTION 으로 막을 수 있어서
          // try/catch 로 사용자에게 실패를 명확히 알린다 (이미 완료된 거래에 다시 누른 경우 등)
          try {
            await completeMutation.mutateAsync(params.id);
            toast?.show("거래가 확정됐어요");
            router.push(`/orders/${params.id}/review`);
          } catch {
            toast?.show("거래 확정에 실패했어요", "error");
          }
        }}
        title="거래를 확정할까요?"
        description="확정하면 후기를 작성할 수 있어요. 환불은 어렵습니다."
        confirmLabel="확정하기"
      />
    </>
  );
}
