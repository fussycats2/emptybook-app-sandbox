"use client";

// 거래 내역 페이지 (/mypage/orders)
// - 상단 탭(구매/판매) + 상태 필터 칩
// - 상태별 액션 버튼 노출 ("거래완료" → 후기, "배송중" → 거래 확정 등)

import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AppHeader from "@/components/ui/AppHeader";
import { ScrollBody } from "@/components/ui/Section";
import BookImage from "@/components/ui/BookImage";
import EmptyState from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import StatusBadge, { type SaleStatus } from "@/components/ui/StatusBadge";
import { type OrderRow } from "@/lib/repo";
import { useOrders } from "@/lib/query/orderHooks";
import { useGetOrCreateChatRoom } from "@/lib/query/chatHooks";
import { palette } from "@/lib/theme";
import { useToast } from "@/components/ui/ToastProvider";

const TABS = [
  { key: "buy", label: "구매" },
  { key: "sell", label: "판매" },
] as const;
const STATUSES = ["전체", "거래중", "배송중", "거래완료", "취소"];

// 주문 내역의 한글 상태(서버) → 카드 우상단에 띄울 배지 색상(UI)으로 매핑
const STATUS_TO_BADGE: Record<OrderRow["status"], SaleStatus> = {
  배송중: "selling",
  거래완료: "sold",
  취소: "canceled",
  거래중: "reserved",
};

export default function OrdersPage() {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("buy");
  const [status, setStatus] = useState("전체");
  const { data: orders, isLoading } = useOrders();
  const chatRoom = useGetOrCreateChatRoom();
  // 채팅 진입 중인 주문 id (버튼 비활성화용)
  const [chatBusyId, setChatBusyId] = useState<string | null>(null);

  // "채팅" 클릭 — order.id 가 아니라 order.bookId 로 chat_rooms 조회/생성
  const handleStartChat = async (item: OrderRow) => {
    if (chatBusyId) return;
    setChatBusyId(item.id);
    try {
      const res = await chatRoom.mutateAsync(item.bookId);
      if ("error" in res) {
        toast?.show("채팅방을 만들 수 없어요", "error");
        return;
      }
      router.push(`/chat/${res.id}`);
    } finally {
      setChatBusyId(null);
    }
  };

  // 1) 탭(구매/판매)으로 side 필터 → 2) 상태 필터(전체 외) 적용
  const list =
    orders
      ?.filter((o) => (tab === "buy" ? o.side === "buy" : o.side === "sell"))
      .filter((o) => status === "전체" || o.status === status) ?? null;

  return (
    <>
      <AppHeader title="거래 내역" left="back" />
      <Box
        sx={{
          background: palette.surface,
          borderBottom: `1px solid ${palette.line}`,
          flexShrink: 0,
        }}
      >
        <Stack direction="row">
          {TABS.map((t) => {
            const on = tab === t.key;
            return (
              <Box
                key={t.key}
                onClick={() => setTab(t.key)}
                sx={{
                  flex: 1,
                  textAlign: "center",
                  py: 1.5,
                  cursor: "pointer",
                  fontWeight: 700,
                  color: on ? palette.primary : palette.inkSubtle,
                  borderBottom: `2.5px solid ${on ? palette.primary : "transparent"}`,
                  fontSize: 14,
                }}
              >
                {t.label}
              </Box>
            );
          })}
        </Stack>
        <Stack
          direction="row"
          gap={0.75}
          className="no-scrollbar"
          sx={{ overflowX: "auto", px: 2, py: 1 }}
        >
          {STATUSES.map((s) => {
            const on = status === s;
            return (
              <Chip
                key={s}
                label={s}
                size="small"
                onClick={() => setStatus(s)}
                variant={on ? "filled" : "outlined"}
                sx={{
                  flexShrink: 0,
                  ...(on && { background: palette.ink, color: "#fff" }),
                }}
              />
            );
          })}
        </Stack>
      </Box>

      <ScrollBody>
        {isLoading && <ListSkeleton count={4} />}
        {list && list.length === 0 && (
          <EmptyState
            icon="🧾"
            title={tab === "buy" ? "구매 내역이 없어요" : "판매 내역이 없어요"}
            description={
              tab === "buy"
                ? "마음에 드는 책을 찾아 첫 거래를 시작해보세요."
                : "내 책장의 책을 등록해 첫 판매를 시작해보세요."
            }
            actionLabel={tab === "buy" ? "책 둘러보기" : "책 등록하기"}
            onAction={() => router.push(tab === "buy" ? "/home" : "/register")}
          />
        )}
        {list?.map((item) => {
          const badge = STATUS_TO_BADGE[item.status] ?? "selling";
          return (
            <Box
              key={item.id}
              sx={{
                p: 2,
                borderBottom: `1px solid ${palette.line}`,
                background: palette.surface,
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                gap={1}
                mb={1}
                sx={{ minWidth: 0 }}
              >
                <Stack
                  direction="row"
                  gap={0.75}
                  alignItems="center"
                  sx={{ minWidth: 0 }}
                >
                  <StatusBadge status={badge} size="sm" />
                  <Typography
                    noWrap
                    sx={{
                      fontSize: 11.5,
                      color: palette.inkSubtle,
                      minWidth: 0,
                    }}
                  >
                    {item.date}
                  </Typography>
                </Stack>
                {/* 좌측 배지에 한글 상태가 이미 표기되므로 우측은 거래번호(끝 6자) 로 — 중복 제거 */}
                <Typography
                  sx={{
                    fontSize: 11,
                    color: palette.inkSubtle,
                    fontFamily: "var(--font-geist-mono, ui-monospace, monospace)",
                    flexShrink: 0,
                    letterSpacing: "0.02em",
                  }}
                >
                  #{item.id.slice(-6).toUpperCase()}
                </Typography>
              </Stack>
              <Stack
                direction="row"
                gap={1.5}
                alignItems="center"
                onClick={() => router.push(`/books/${item.bookId}`)}
                sx={{ cursor: "pointer" }}
              >
                <BookImage seed={item.bookId} width={68} height={84} radius={10} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 14.5, fontWeight: 800 }}>
                    {item.title}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: palette.inkSubtle, mt: 0.25 }}>
                    {item.info}
                  </Typography>
                  <Typography sx={{ fontSize: 16, fontWeight: 800, mt: 0.5 }}>
                    {item.price}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" gap={0.75} mt={1.5}>
                {item.status === "거래완료" && (
                  <Button
                    variant="outlined"
                    sx={{ flex: 1 }}
                    size="small"
                    onClick={() => router.push(`/orders/${item.id}/review`)}
                  >
                    후기 작성
                  </Button>
                )}
                {/* 거래 확정은 구매자(받았어요) 액션이라 판매 탭에선 숨긴다 */}
                {item.status === "배송중" && tab === "buy" && (
                  <Button
                    sx={{ flex: 1.5 }}
                    size="small"
                    onClick={() => router.push(`/orders/${item.id}`)}
                  >
                    거래 확정
                  </Button>
                )}
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ flex: 1 }}
                  onClick={() => handleStartChat(item)}
                  disabled={chatBusyId === item.id}
                >
                  채팅
                </Button>
              </Stack>
            </Box>
          );
        })}
      </ScrollBody>
    </>
  );
}
