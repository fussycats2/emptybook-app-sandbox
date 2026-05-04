"use client";

// 채팅 목록 페이지 (/chat)
// 전체/구매/판매 탭 + 대화방 검색 + 채팅방 카드 리스트
// Realtime: chat_rooms / messages INSERT·UPDATE 이벤트는 AppBootstrap 의
// useRealtimeChatList 가 전역으로 구독해 listChats 캐시를 invalidate 한다.

import {
  Box,
  IconButton,
  InputAdornment,
  OutlinedInput,
  Stack,
  Typography,
} from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AppHeader from "@/components/ui/AppHeader";
import BottomTabNav from "@/components/ui/BottomTabNav";
import { ScrollBody } from "@/components/ui/Section";
import EmptyState from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import StatusBadge from "@/components/ui/StatusBadge";
import BookImage from "@/components/ui/BookImage";
import { useChats } from "@/lib/query/chatHooks";
import { palette } from "@/lib/theme";

const TABS = [
  { key: "all", label: "전체" },
  { key: "buy", label: "구매" },
  { key: "sell", label: "판매" },
] as const;

export default function ChatListPage() {
  const router = useRouter();
  const [active, setActive] = useState<(typeof TABS)[number]["key"]>("all");
  const [q, setQ] = useState("");
  const { data: chats, isLoading } = useChats();

  // 탭(전체/구매/판매) + 검색어로 동시 필터링
  // user/book/msg 셋을 합친 문자열에 검색어가 포함되는지로 단순 매칭
  const filtered =
    chats?.filter((c) => {
      if (active === "buy" && !c.buying) return false;
      if (active === "sell" && c.buying) return false;
      if (q && !`${c.user}${c.book}${c.msg}`.includes(q)) return false;
      return true;
    }) ?? null;

  return (
    <>
      <AppHeader
        title="채팅"
        left="none"
        bordered={false}
        right={
          <IconButton onClick={() => router.push("/register")}>
            <EditRoundedIcon />
          </IconButton>
        }
      />
      <Box
        sx={{
          px: 2,
          pb: 1.5,
          background: palette.surface,
          borderBottom: `1px solid ${palette.line}`,
        }}
      >
        <OutlinedInput
          fullWidth
          placeholder="대화방 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          startAdornment={
            <InputAdornment position="start">
              <SearchRoundedIcon sx={{ color: palette.inkSubtle }} />
            </InputAdornment>
          }
          sx={{
            background: palette.lineSoft,
            borderRadius: 999,
            "& fieldset": { border: "none" },
            "& input": { py: 1.25, fontSize: 13.5 },
          }}
        />
        <Stack direction="row" gap={1} mt={1.5}>
          {TABS.map((t) => {
            const on = active === t.key;
            return (
              <Box
                key={t.key}
                onClick={() => setActive(t.key)}
                sx={{
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 999,
                  background: on ? palette.ink : palette.lineSoft,
                  color: on ? "#fff" : palette.inkMute,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {t.label}
              </Box>
            );
          })}
        </Stack>
      </Box>
      <ScrollBody>
        {isLoading && <ListSkeleton count={4} />}
        {filtered && filtered.length === 0 && (
          <EmptyState
            icon={<ChatBubbleOutlineRoundedIcon />}
            title={q ? "대화 결과가 없어요" : "아직 대화가 없어요"}
            description={
              q
                ? "다른 검색어로 시도해보세요."
                : "마음에 드는 책에 채팅을 걸어 거래를 시작해보세요."
            }
            actionLabel={q ? undefined : "책 둘러보기"}
            onAction={q ? undefined : () => router.push("/home")}
          />
        )}
        {filtered?.map((c) => (
          <Box
            key={c.id}
            onClick={() => router.push(`/chat/${c.id}`)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              p: "14px 16px",
              borderBottom: `1px solid ${palette.line}`,
              cursor: "pointer",
              background: c.unread ? palette.surface : "transparent",
              "&:hover": { background: palette.lineSoft },
            }}
          >
            <Box sx={{ position: "relative" }}>
              <BookImage seed={c.user} width={48} height={48} radius={999} />
              <Box
                sx={{
                  position: "absolute",
                  bottom: -2,
                  right: -2,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: c.buying ? palette.primary : palette.accent,
                  color: "#fff",
                  fontSize: 9.5,
                  fontWeight: 800,
                  display: "grid",
                  placeItems: "center",
                  border: `2px solid ${palette.surface}`,
                }}
              >
                {c.buying ? "구" : "판"}
              </Box>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack
                direction="row"
                alignItems="center"
                gap={0.75}
                sx={{ minWidth: 0 }}
              >
                <Typography
                  noWrap
                  sx={{ fontSize: 14.5, fontWeight: 800, minWidth: 0 }}
                >
                  {c.user}
                </Typography>
                {c.status && <StatusBadge status={c.status} size="sm" />}
                <Box sx={{ flex: 1 }} />
                <Typography
                  sx={{
                    fontSize: 11,
                    color: palette.inkSubtle,
                    flexShrink: 0,
                  }}
                >
                  {c.time}
                </Typography>
              </Stack>
              <Typography
                sx={{
                  fontSize: 12,
                  color: palette.inkSubtle,
                  mb: 0.25,
                }}
              >
                {c.book}
              </Typography>
              <Typography
                sx={{
                  fontSize: 13,
                  color: c.unread ? palette.ink : palette.inkMute,
                  fontWeight: c.unread ? 600 : 400,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {c.msg}
              </Typography>
            </Box>
            {c.unread > 0 && (
              <Box
                sx={{
                  minWidth: 20,
                  height: 20,
                  px: 0.75,
                  background: palette.accent,
                  borderRadius: 999,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 10.5,
                  color: "#fff",
                  fontWeight: 800,
                }}
              >
                {c.unread}
              </Box>
            )}
          </Box>
        ))}
      </ScrollBody>
      <BottomTabNav />
    </>
  );
}
