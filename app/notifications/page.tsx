"use client";

// 알림 페이지 (/notifications)
// - 종류별(전체/거래/채팅/시스템) 필터 + "안 읽음만" 토글
// - "모두 읽음" 누르면 클라이언트 상태에서 읽음 처리 (서버 갱신은 미구현)
// TODO: 클릭 시 notifications.read_at 을 UPDATE 하는 서버 호출 필요

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
import { useEffect, useState } from "react";
import AppHeader from "@/components/ui/AppHeader";
import { ScrollBody } from "@/components/ui/Section";
import EmptyState from "@/components/ui/EmptyState";
import { listNotifications, type NotificationRow } from "@/lib/repo";
import { palette } from "@/lib/theme";
import { useToast } from "@/components/ui/ToastProvider";
import { ListSkeleton } from "@/components/ui/Skeleton";

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
  chat: { icon: <ChatBubbleRoundedIcon />, bg: "#FFF1E0", fg: "#B16A00" },
  system: { icon: <CampaignRoundedIcon />, bg: "#FCE8E5", fg: palette.accent },
};

export default function NotificationsPage() {
  const toast = useToast();
  const [type, setType] = useState("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [items, setItems] = useState<NotificationRow[] | null>(null);

  useEffect(() => {
    listNotifications().then(setItems).catch(() => setItems([]));
  }, []);

  // 종류 필터 + 안읽음 필터 동시 적용
  const list = (items ?? []).filter((n) => {
    if (type !== "all" && n.type !== type) return false;
    if (unreadOnly && !n.unread) return false;
    return true;
  });

  return (
    <>
      <AppHeader
        title="알림"
        left="back"
        right={
          <Typography
            onClick={() => {
              setItems((arr) =>
                (arr ?? []).map((x) => ({ ...x, unread: false }))
              );
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
          background: palette.surface,
          borderBottom: `1px solid ${palette.line}`,
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
        {!items && <ListSkeleton count={4} />}
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
                p: "14px 16px",
                borderBottom: `1px solid ${palette.line}`,
                background: n.unread ? palette.surface : "transparent",
                cursor: "pointer",
              }}
              // 클릭한 알림만 unread=false 로 갱신 (서버 반영은 추후 추가 예정)
              onClick={() =>
                setItems((arr) =>
                  (arr ?? []).map((x) =>
                    x.id === n.id ? { ...x, unread: false } : x
                  )
                )
              }
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: conf.bg,
                  color: conf.fg,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                {conf.icon}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" alignItems="center" gap={0.5}>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 800 }}>
                    {n.title}
                  </Typography>
                  {n.unread && (
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: palette.accent,
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
