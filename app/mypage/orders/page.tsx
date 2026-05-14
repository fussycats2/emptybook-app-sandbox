"use client";

// 구매 내역 페이지 (/mypage/orders)
// - 상태 필터 칩 (전체/거래중/배송중/거래완료/취소)
// - 판매 내역(/mypage/selling) 의 BookListRow 와 동일한 행 레이아웃 사용
// - 카드 탭 → /orders/[id] (배송정보·거래확정·후기·채팅 흐름 진입)

import { Box, Chip, Stack, Typography } from "@mui/material";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
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
import { palette } from "@/lib/theme";

const STATUSES = ["전체", "거래중", "배송중", "거래완료", "취소"];

// 주문 내역의 한글 상태(서버) → 우측 배지(UI) 매핑
// 책의 SOLD/SELLING 과 다른 도메인(주문 진행 상태) 이라 "배송중" 은 shipping 키 사용
const STATUS_TO_BADGE: Record<OrderRow["status"], SaleStatus> = {
  배송중: "shipping",
  거래완료: "sold",
  취소: "canceled",
  거래중: "reserved",
};

export default function OrdersPage() {
  const router = useRouter();
  const [status, setStatus] = useState("전체");
  const { data: orders, isLoading } = useOrders();

  // 구매(buy) 측 거래만 노출. 판매 측은 /mypage/selling 에서 따로 관리.
  const list =
    orders
      ?.filter((o) => o.side === "buy")
      .filter((o) => status === "전체" || o.status === status) ?? null;

  return (
    <>
      <AppHeader title="구매 내역" left="back" />
      <Box
        sx={{
          background: palette.surface,
          borderBottom: `1px solid ${palette.line}`,
          flexShrink: 0,
        }}
      >
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
            icon={<ShoppingBagOutlinedIcon />}
            title="구매 내역이 없어요"
            description="마음에 드는 책을 찾아 첫 거래를 시작해보세요."
            actionLabel="책 둘러보기"
            onAction={() => router.push("/home")}
          />
        )}
        {list && list.length > 0 && (
          <Box sx={{ background: palette.surface }}>
            {list.map((item) => {
              const badge = STATUS_TO_BADGE[item.status] ?? "selling";
              return (
                <Box
                  key={item.id}
                  onClick={() => router.push(`/orders/${item.id}`)}
                  sx={{
                    display: "flex",
                    gap: 1.5,
                    p: "14px 16px",
                    borderBottom: `1px solid ${palette.lineSoft}`,
                    cursor: "pointer",
                    transition: "background 160ms ease",
                    "&:hover": { background: palette.surfaceAlt },
                  }}
                >
                  {/* BookListRow 와 동일 — autoWidth 로 표지 자연 비율 그대로 표시 */}
                  <BookImage
                    seed={item.bookId}
                    src={item.bookCover}
                    height={88}
                    radius={0}
                    autoWidth
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: 14,
                        fontWeight: 700,
                        letterSpacing: "-0.02em",
                        display: "-webkit-box",
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Typography
                      sx={{ fontSize: 11.5, color: palette.inkSubtle, mt: 0.25 }}
                    >
                      {item.info}
                    </Typography>
                    <Stack direction="row" gap={0.75} mt={0.85} alignItems="center">
                      <Typography
                        sx={{
                          fontSize: 14.5,
                          fontWeight: 800,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {item.price}
                      </Typography>
                    </Stack>
                    <Typography sx={{ fontSize: 11, color: palette.inkSubtle, mt: 0.5 }}>
                      {item.date}
                    </Typography>
                  </Box>
                  <Box sx={{ alignSelf: "flex-start" }}>
                    <StatusBadge status={badge} size="sm" />
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </ScrollBody>
    </>
  );
}
