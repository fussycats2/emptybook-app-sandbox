"use client";

// 알림 페이지 (/notifications)
// - 종류별(전체/거래/채팅/시스템) 필터 + "안 읽음만" 토글
// - 알림 클릭 → markNotificationRead, "모두 읽음" → markAllNotificationsRead 로 서버 read_at 갱신
//   (UI는 즉시 토글하고 서버 호출은 fire-and-forget)

import {
  Box,
  Chip,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import NotificationsOffRoundedIcon from "@mui/icons-material/NotificationsOffRounded";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/ui/AppHeader";
import { ScrollBody } from "@/components/ui/Section";
import EmptyState from "@/components/ui/EmptyState";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/lib/query/notificationHooks";
import { palette } from "@/lib/theme";
import { useToast } from "@/components/ui/ToastProvider";
import { ListSkeleton } from "@/components/ui/Skeleton";
import type { NotificationRow } from "@/lib/repo";

const TYPES = [
  { key: "all", label: "전체" },
  { key: "trade", label: "거래" },
  { key: "chat", label: "채팅" },
  { key: "system", label: "시스템" },
];

// 알림 type → 좌측 원형 아이콘(아이콘 + 배경색 + 전경색) 매핑
const ICONS: Record<string, { icon: React.ReactNode; bg: string; fg: string }> = {
  trade: {
    icon: <LocalShippingRoundedIcon />,
    bg: palette.primarySoft,
    fg: palette.primary,
  },
  chat: { icon: <ChatBubbleRoundedIcon />, bg: palette.warnSoft, fg: palette.warn },
  system: {
    icon: <CampaignRoundedIcon />,
    bg: palette.accentSoft,
    fg: palette.accent,
  },
};

export default function NotificationsPage() {
  const router = useRouter();
  const toast = useToast();
  const [type, setType] = useState("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  // React Query — 결과는 캐시에 보관, optimistic mutation 으로 즉시 갱신
  const { data: items, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  // 알림 클릭 → (1) 읽음 처리(optimistic) (2) 종류별로 적절한 화면으로 이동
  // - chat   : roomId 있으면 채팅방으로
  // - trade  : transactionId 있으면 주문 상세, 없으면 거래 내역, 그 외 bookId 폴백
  // - system : bookId 있으면 책 상세, 없으면 공지
  const handleClick = (n: NotificationRow) => {
    if (n.unread) markRead.mutate(n.id);
    if (n.type === "chat") {
      if (n.roomId) router.push(`/chat/${n.roomId}`);
      else router.push("/chat");
      return;
    }
    if (n.type === "trade") {
      if (n.transactionId) router.push(`/orders/${n.transactionId}`);
      else if (n.bookId) router.push(`/books/${n.bookId}`);
      else router.push("/mypage/orders");
      return;
    }
    // system
    if (n.bookId) router.push(`/books/${n.bookId}`);
    else router.push("/notices");
  };

  // 종류 필터 + 안읽음 필터 동시 적용 — 알림이 많을 때 스크롤/토글 시 매 렌더 재계산 회피
  const list = useMemo(
    () =>
      (items ?? []).filter((n) => {
        if (type !== "all" && n.type !== type) return false;
        if (unreadOnly && !n.unread) return false;
        return true;
      }),
    [items, type, unreadOnly]
  );

  return (
    <>
      <AppHeader
        title="알림"
        left="back"
        right={
          <Typography
            onClick={() => {
              markAllRead.mutate();
              toast?.show("모두 읽음으로 표시했어요");
            }}
            sx={{
              fontSize: 12.5,
              color: palette.primary,
              fontWeight: 700,
              cursor: "pointer",
              pr: 1,
            }}
          >
            모두 읽음
          </Typography>
        }
      />
      <Box
        sx={{
          background: `linear-gradient(180deg, ${palette.surface} 0%, ${palette.surface}F2 100%)`,
          backdropFilter: "saturate(160%) blur(8px)",
          WebkitBackdropFilter: "saturate(160%) blur(8px)",
          borderBottom: `1px solid ${palette.lineSoft}`,
          px: 2,
          py: 1.25,
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexShrink: 0,
          overflowX: "auto",
        }}
        className="no-scrollbar"
      >
        {TYPES.map((t) => {
          const on = t.key === type;
          return (
            <Chip
              key={t.key}
              label={t.label}
              size="small"
              onClick={() => setType(t.key)}
              variant={on ? "filled" : "outlined"}
              sx={{
                flexShrink: 0,
                ...(on && { background: palette.ink, color: "#fff" }),
              }}
            />
          );
        })}
        <Box sx={{ flex: 1 }} />
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={unreadOnly}
              onChange={(_, v) => setUnreadOnly(v)}
            />
          }
          label={
            <Typography sx={{ fontSize: 12, color: palette.inkMute }}>
              안 읽음만
            </Typography>
          }
          sx={{ ml: 1 }}
        />
      </Box>

      <ScrollBody>
        {isLoading && <ListSkeleton count={4} />}
        {items && list.length === 0 && (
          <EmptyState
            icon={<NotificationsOffRoundedIcon />}
            title="새로운 알림이 없어요"
            description="중요한 소식이 오면 알려드릴게요."
          />
        )}
        {list.map((n) => {
          const conf = ICONS[n.type];
          return (
            <Box
              key={n.id}
              sx={{
                display: "flex",
                gap: 1.5,
                p: "16px 16px",
                borderBottom: `1px solid ${palette.lineSoft}`,
                background: n.unread ? palette.surface : "transparent",
                cursor: "pointer",
                transition: "background 160ms ease",
                position: "relative",
                "&:hover": { background: palette.surfaceAlt },
                ...(n.unread && {
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 3,
                    background: palette.accent,
                  },
                }),
              }}
              // 클릭 → 읽음 처리 + 종류별 화면으로 이동
              onClick={() => handleClick(n)}
            >
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  background: conf.bg,
                  color: conf.fg,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  border: `1px solid ${conf.fg}1A`,
                }}
              >
                {conf.icon}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  gap={0.5}
                  sx={{ minWidth: 0 }}
                >
                  <Typography
                    noWrap
                    sx={{ fontSize: 13.5, fontWeight: 800, minWidth: 0 }}
                  >
                    {n.title}
                  </Typography>
                  {n.unread && (
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: palette.accent,
                        flexShrink: 0,
                      }}
                    />
                  )}
                </Stack>
                <Typography
                  sx={{
                    fontSize: 12.5,
                    color: palette.inkMute,
                    mt: 0.25,
                    lineHeight: 1.5,
                  }}
                >
                  {n.body}
                </Typography>
                <Typography sx={{ fontSize: 11, color: palette.inkSubtle, mt: 0.5 }}>
                  {n.time}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </ScrollBody>
    </>
  );
}
