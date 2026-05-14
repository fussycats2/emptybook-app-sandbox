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
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import RateReviewRoundedIcon from "@mui/icons-material/RateReviewRounded";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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
  const searchParams = useSearchParams();
  const [confirm, setConfirm] = useState(false);
  // React Query — order 가 먼저 로드되면 그 안의 bookId 로 useBook 활성화 (의존 쿼리)
  const { data: order } = useOrder(params.id);
  const { data: book } = useBook(order?.bookId);
  const completeMutation = useCompleteOrder();

  // /mypage/orders 의 "거래 확정" 버튼이 ?confirm=1 로 진입시키면 자동으로 ConfirmDialog 노출.
  // 이미 거래완료된 경우엔 무의미하므로 띄우지 않는다. 한 번 띄운 뒤 query 를 정리해서
  // 사용자가 페이지를 다시 보거나 새로고침했을 때 다이얼로그가 다시 떠 있지 않게 한다.
  useEffect(() => {
    if (searchParams?.get("confirm") !== "1") return;
    if (order?.status === "거래완료") return;
    setConfirm(true);
    router.replace(`/orders/${params.id}`);
  }, [searchParams, order?.status, params.id, router]);

  const seedId = book?.id ?? order?.bookId ?? params.id;
  const title = book?.title ?? order?.title ?? "도서";
  const sellerName = book?.seller ?? "판매자";
  const purchaseDate = order?.date ?? "-";
  // 거래완료 후엔 footer 를 "후기 작성" + "홈으로" 로 교체해 사용자가 깊은 흐름에서 빠져나갈 길을 보장.
  // 같은 페이지에서 STEPS 트래커는 그대로 보여주되, 안내/액션만 바뀌는 식.
  const isCompleted = order?.status === "거래완료";

  return (
    <>
      <AppHeader
        title="거래 확정"
        left="back"
        // 거래확정 화면은 /mypage/orders → /orders/[id] 깊이라 router.back() 만 해도
        // 의미 있는 곳에 닿지만, 알림에서 직접 진입하는 케이스도 있어 항상 홈으로 빠질 수단 제공.
        homeButton
      />
      <ScrollBody>
        <Box
          sx={{
            background: palette.surface,
            p: 2,
            display: "flex",
            gap: 1.5,
            alignItems: "center",
            borderBottom: `1px solid ${palette.lineSoft}`,
          }}
        >
          <BookImage seed={seedId} src={book?.coverUrl} width={68} height={88} radius={12} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: 14.5,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {title}
            </Typography>
            <Typography sx={{ fontSize: 12, color: palette.inkSubtle, mt: 0.4 }}>
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
            borderRadius: 1.5,
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
              borderRadius: 1.5,
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
              borderRadius: 1.5,
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

        {isCompleted ? (
          // 거래확정이 끝난 뒤엔 안내문을 완료 톤으로 교체 — 사용자가 같은 페이지에 있어도
          // "끝났구나" 가 한눈에 보이게.
          <Box
            sx={{
              mx: 2,
              mb: 2,
              background: `${palette.primary}10`,
              border: `1px solid ${palette.primary}33`,
              borderRadius: 1.5,
              p: 1.75,
              color: palette.primary,
              fontSize: 12.5,
              lineHeight: 1.65,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <CheckCircleRoundedIcon sx={{ fontSize: 18 }} />
            거래가 확정됐어요. 후기를 남겨 주세요.
          </Box>
        ) : (
          <Box
            sx={{
              mx: 2,
              mb: 2,
              background: palette.warnSoft,
              border: `1px solid ${palette.warn}33`,
              borderRadius: 1.5,
              p: 1.75,
              color: "#7A5800",
              fontSize: 12.5,
              lineHeight: 1.65,
              fontWeight: 600,
              letterSpacing: "-0.01em",
            }}
          >
            📦 책 상태를 꼭 확인하고 확정해주세요. 거래 확정 후에는 환불이 어려워요.
          </Box>
        )}
      </ScrollBody>
      <FixedFooter>
        {isCompleted ? (
          // 거래완료 후 — 같은 화면에 머물지 않고 자연스럽게 다음 단계로 보낼 수 있게 두 CTA 분기.
          // 후기 작성으로 가거나, 곧장 홈으로. 뒤로가기로만 빠져나가야 했던 막다른 길 해소.
          <Stack direction="row" gap={1}>
            <Button
              variant="outlined"
              sx={{ flex: 1 }}
              startIcon={<HomeRoundedIcon />}
              onClick={() => router.push("/home")}
            >
              홈으로
            </Button>
            <Button
              sx={{ flex: 1.5 }}
              startIcon={<RateReviewRoundedIcon />}
              onClick={() => router.push(`/orders/${params.id}/review`)}
            >
              후기 작성하기
            </Button>
          </Stack>
        ) : (
          <Stack direction="row" gap={1}>
            <Button variant="outlined" sx={{ flex: 1 }} onClick={() => toast?.show("신고가 접수됐어요")}>
              문제 신고
            </Button>
            <Button sx={{ flex: 1.5 }} onClick={() => setConfirm(true)}>
              거래 확정하기
            </Button>
          </Stack>
        )}
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
            // 자동 redirect 대신 페이지를 거래완료 상태로 잠그고 footer CTA(후기/홈)로 분기.
            // 즉시 후기로 보내면 "홈으로 가고 싶었던" 사용자가 또 막다른 길에 갇히게 됨.
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
