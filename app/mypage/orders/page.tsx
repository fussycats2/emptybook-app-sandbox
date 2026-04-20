"use client";

import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppHeader from "@/components/ui/AppHeader";
import { ScrollBody } from "@/components/ui/Section";
import BookImage from "@/components/ui/BookImage";
import EmptyState from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import StatusBadge, { type SaleStatus } from "@/components/ui/StatusBadge";
import { listOrders } from "@/lib/repo";
import { palette } from "@/lib/theme";

const TABS = [
  { key: "buy", label: "구매" },
  { key: "sell", label: "판매" },
] as const;
const STATUSES = ["전체", "거래중", "배송중", "거래완료", "취소"];

const STATUS_TO_BADGE: Record<string, SaleStatus> = {
  배송중: "selling",
  거래완료: "sold",
  취소: "sold",
  거래중: "reserved",
};

export default function OrdersPage() {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("buy");
  const [status, setStatus] = useState("전체");
  const [orders, setOrders] = useState<any[] | null>(null);

  useEffect(() => {
    listOrders()
      .then((o) => setOrders(o))
      .catch(() => setOrders([]));
  }, []);

  const list =
    orders?.filter((o) => status === "전체" || o.status === status) ?? null;

  return (
    <>
      <AppHeader title="거래 내역" left="back" />
      <Box
        sx={{
          background: palette.surface,
          borderBottom: `1px solid ${palette.line}`,
          position: "sticky",
          top: 0,
          zIndex: 5,
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
        {!list && <ListSkeleton count={4} />}
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
                mb={1}
              >
                <Stack direction="row" gap={0.75} alignItems="center">
                  <StatusBadge status={badge} size="sm" />
                  <Typography sx={{ fontSize: 11.5, color: palette.inkSubtle }}>
                    {item.date}
                  </Typography>
                </Stack>
                <Typography sx={{ fontSize: 11.5, color: palette.inkSubtle }}>
                  {item.status}
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
                {item.status === "배송중" && (
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
                  onClick={() => router.push(`/chat/${item.id}`)}
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
