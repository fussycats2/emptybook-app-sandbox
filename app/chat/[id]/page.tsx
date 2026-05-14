"use client";

// 채팅 상세 페이지 (/chat/[id])
// - 상단: 상대 프로필 헤더 + 거래 도서 미니 카드(거래액션 버튼)
// - 본문: 시스템/내/상대 메시지 말풍선 (useRealtimeChat 훅이 messages 테이블 구독)
// - 하단: 메시지 입력창 + 전송 버튼 (sendMessage repo → DB INSERT)

import {
  Box,
  IconButton,
  OutlinedInput,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import BookImage from "@/components/ui/BookImage";
import UserAvatar from "@/components/ui/UserAvatar";
import StatusBadge from "@/components/ui/StatusBadge";
import { palette } from "@/lib/theme";
import { useToast } from "@/components/ui/ToastProvider";
import { useChat } from "@/lib/query/chatHooks";
import { useBook } from "@/lib/query/bookHooks";
import { useRealtimeChat } from "@/lib/realtime/useRealtimeChat";
import {
  markRoomChatNotificationsRead,
  markRoomMessagesRead,
  type ChatRow,
  type NotificationRow,
} from "@/lib/repo";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { useNotificationsStore } from "@/lib/store/notificationsStore";

export default function ChatDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const toast = useToast();
  // React Query — chat 이 먼저 로드되면 그 안의 bookId 로 책 조회 (의존 쿼리)
  const { data: chat } = useChat(params.id);
  const { data: book } = useBook(chat?.bookId ?? params.id);

  // 실시간 메시지 — 초기 로드 + Realtime INSERT 구독 + send()
  const { messages: msgs, send: sendMsg } = useRealtimeChat(params.id);
  const [draft, setDraft] = useState("");

  // 새 메시지 들어오면 자동 스크롤 (가장 마지막 메시지가 보이도록)
  const bottomRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs.length]);

  // 채팅방을 보고 있는 동안 상대 메시지 + 그 방의 chat 알림을 함께 읽음 처리
  // - 마운트 직후 1회 + 새 메시지가 도착할 때마다 호출 (read_at IS NULL 조건이라 idempotent)
  // - 사용자 체감을 즉시 만들기 위해 채팅 목록·알림 목록 캐시와 unread store 를 먼저 패치
  //   (서버 응답 기다리면 5-10초씩 늦게 반영되던 문제 — Realtime 은 messages UPDATE 를
  //    구독하지 않아 read_at 변경 자체로는 invalidate 가 트리거되지 않음)
  // - 그 후 백그라운드에서 실제 UPDATE 를 날리고, 다음 자연 refetch 시점에 정정된다
  const qc = useQueryClient();
  const setUnreadCount = useNotificationsStore((s) => s.setUnreadCount);
  useEffect(() => {
    if (!params.id) return;

    // 1) 낙관적 패치 — 채팅 목록 캐시에서 이 방의 unread 0 처리
    qc.setQueryData<ChatRow[] | undefined>(
      queryKeys.chat.list(),
      (old) =>
        old?.map((c) => (c.id === params.id ? { ...c, unread: 0 } : c))
    );

    // 2) 낙관적 패치 — 알림 목록에서 이 방의 MESSAGE 알림을 read 처리 + store 반영
    const prevNotis = qc.getQueryData<NotificationRow[]>(
      queryKeys.notification.list()
    );
    if (prevNotis) {
      const next = prevNotis.map((n) =>
        n.unread && n.roomId === params.id ? { ...n, unread: false } : n
      );
      const changed = next.some((n, i) => n.unread !== prevNotis[i].unread);
      if (changed) {
        qc.setQueryData(queryKeys.notification.list(), next);
        setUnreadCount(next.filter((n) => n.unread).length);
      }
    }

    // 3) 백그라운드 — 서버에 read_at UPDATE. 응답 후 캐시 invalidate 로 정정
    //    cancelled 가드를 두지 않는다: 사용자가 빨리 뒤로 가도 읽음 처리는 끝까지 반영
    void Promise.all([
      markRoomMessagesRead(params.id),
      markRoomChatNotificationsRead(params.id),
    ]).then(([msgN, notiN]) => {
      if (msgN > 0) qc.invalidateQueries({ queryKey: queryKeys.chat.list() });
      if (notiN > 0)
        qc.invalidateQueries({ queryKey: queryKeys.notification.list() });
    });
  }, [params.id, msgs.length, qc, setUnreadCount]);

  // 메시지 전송 — 빈 문자열은 무시. send 결과는 훅이 state에 push
  const send = async () => {
    const text = draft.trim();
    if (!text) return;
    setDraft(""); // 즉시 입력창 비우기 (낙관적 UI)
    const result = await sendMsg(text);
    if (!result) {
      // 실패 시 입력값 복구 + 토스트
      setDraft(text);
      toast?.show("메시지 전송에 실패했어요", "error");
    }
  };

  // 채팅 헤더 보조 라인 — 동네 + ★rating · 거래 N회 (데이터 없으면 가능한 만큼만)
  // 이전에는 매너온도 38.6℃ 가 모든 채팅에 동일하게 박혀 있었음. fetchChat 가 partner
  // profile 의 rating_avg / trade_count 를 같이 가져오므로 실데이터로 교체.
  const region = book?.region ?? book?.loc ?? null;
  const rating = chat?.partnerRating;
  const tradeCount = chat?.partnerTradeCount;
  const hasReputation =
    typeof rating === "number" && typeof tradeCount === "number";
  // 책 상태는 서버 데이터(book.status) 를 직접 그린다 — 거래액션 메뉴 제거 후 로컬 토글 없음.
  // 책의 status 가 아직 안 들어왔으면 chat 의 status (chat_rooms join 결과) 로 폴백.
  const bookStatus = book?.status ?? chat?.status ?? "selling";

  return (
    <>
      <Box
        sx={{
          height: 56,
          borderBottom: `1px solid ${palette.lineSoft}`,
          display: "flex",
          alignItems: "center",
          px: 1,
          gap: 1.25,
          flexShrink: 0,
          background: `linear-gradient(180deg, ${palette.surface} 0%, ${palette.surface}F2 100%)`,
          backdropFilter: "saturate(160%) blur(8px)",
          WebkitBackdropFilter: "saturate(160%) blur(8px)",
        }}
      >
        <IconButton onClick={() => router.back()}>
          <ArrowBackIosNewRoundedIcon fontSize="small" />
        </IconButton>
        {/* 상대방 프로필 아바타 — profiles.avatar_url 우선, 없으면 이니셜 + seed 색.
            책 표지는 아래 미니 카드에 따로 노출 (헤더와 시각적 분리). */}
        <UserAvatar
          name={chat?.user ?? book?.seller}
          seed={params.id}
          src={chat?.partnerAvatarUrl}
          size={36}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 14.5, fontWeight: 800, letterSpacing: "-0.02em" }}>
            {chat?.user ?? book?.seller ?? "판매자"}
          </Typography>
          <Stack
            direction="row"
            alignItems="center"
            gap={0.5}
            sx={{ fontSize: 11, color: palette.inkSubtle, mt: 0.1 }}
          >
            {region && <span>{region}</span>}
            {region && hasReputation && <span>·</span>}
            {hasReputation && (
              <>
                <StarRoundedIcon
                  sx={{ fontSize: 12, color: palette.warn, mr: -0.25 }}
                />
                <span style={{ fontWeight: 700, color: palette.ink }}>
                  {rating!.toFixed(1)}
                </span>
                <span>· 거래 {tradeCount}회</span>
              </>
            )}
          </Stack>
        </Box>
        <IconButton
          onClick={() => router.push("/home")}
          aria-label="홈으로 이동"
          sx={{ color: palette.ink }}
        >
          <HomeRoundedIcon />
        </IconButton>
        <IconButton onClick={() => toast?.show("준비 중이에요")}>
          <MoreVertRoundedIcon />
        </IconButton>
      </Box>

      <Box
        sx={{
          background: palette.surfaceAlt,
          p: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          borderBottom: `1px solid ${palette.lineSoft}`,
          flexShrink: 0,
        }}
      >
        <BookImage
          seed={book?.id ?? params.id}
          src={book?.coverUrl ?? chat?.bookCover}
          width={44}
          height={56}
          radius={8}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" gap={0.5}>
            <StatusBadge status={bookStatus} size="sm" />
            <Typography
              sx={{
                fontSize: 12.5,
                fontWeight: 700,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {book?.title ?? "도서"}
            </Typography>
          </Stack>
          <Typography sx={{ fontSize: 13.5, fontWeight: 800, mt: 0.25 }}>
            {book?.price ?? ""}
          </Typography>
        </Box>
        {/*
          거래액션 메뉴(예약/완료/취소) 는 제거. 이유:
          - reserve/cancel 은 로컬 state 만 토글하고 DB 반영이 없어 새로고침하면 사라짐
          - "거래완료" 는 chat room id 를 /orders/[id]/review 로 넘겨 다른 도메인 id 충돌
          - 셀러는 /books/[id] 의 MoreVert(수정/판매취소/삭제) 로 책 상태를 관리 — 단일 출처
        */}
      </Box>

      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: "16px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 1.25,
          background: palette.bg,
        }}
      >
        {msgs.map((m, i) => {
          const time = formatMsgTime(m.createdAt);
          // 날짜 구분선 — 직전 메시지와 날짜가 다르면 그룹 시작 위치에 삽입.
          // 이전엔 정적인 "2024년 1월 15일" 한 칩만 떠 있어 실제 메시지 날짜와 무관했음.
          const dateLabel = formatMsgDate(m.createdAt);
          const prevDateLabel =
            i > 0 ? formatMsgDate(msgs[i - 1].createdAt) : "";
          const showDateSep = dateLabel && dateLabel !== prevDateLabel;
          if (m.type === "system") {
            return (
              <Fragment key={m.id}>
                {showDateSep && <DateSeparator label={dateLabel} />}
                <Box
                  sx={{
                    alignSelf: "center",
                    background: palette.lineSoft,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 999,
                    fontSize: 11.5,
                    color: palette.inkMute,
                    fontWeight: 600,
                  }}
                >
                  {m.body}
                </Box>
              </Fragment>
            );
          }
          // 말풍선 공통 스타일 — 텍스트 줄바꿈 규칙(Korean 안전)
          const bubbleBase = {
            p: "9px 13px",
            fontSize: 13.5,
            lineHeight: 1.55,
            whiteSpace: "pre-wrap" as const,
            wordBreak: "break-word" as const,
            overflowWrap: "anywhere" as const,
          };
          // 말풍선 너비 제어:
          //  - 외부 wrapper 가 maxWidth(75%) + minWidth:0 을 가짐 → flex 안에서 수축 가능
          //  - 내부 bubble 은 width:auto 라 짧은 글에서는 콘텐츠 크기, 길어지면 wrapper 까지 채움
          //  - 이전 구조는 wrapper 가 콘텐츠 기반으로 줄어들면서 70% 가 글자 한 자 너비로 깎이는 버그가 있었음
          return (
            <Fragment key={m.id}>
              {showDateSep && <DateSeparator label={dateLabel} />}
              {m.mine ? (
                <Stack
                  direction="row"
                  gap={0.75}
                  alignItems="flex-end"
                  justifyContent="flex-end"
                  sx={{ pl: 6 }}
                >
                  <Box
                    sx={{
                      fontSize: 10.5,
                      color: palette.inkSubtle,
                      flexShrink: 0,
                    }}
                  >
                    {m.read ? "읽음 · " : ""}
                    {time}
                  </Box>
                  <Stack
                    sx={{
                      minWidth: 0,
                      maxWidth: "75%",
                      alignItems: "flex-end",
                    }}
                  >
                    <Box
                      sx={{
                        ...bubbleBase,
                        background: `linear-gradient(160deg, ${palette.primary} 0%, ${palette.primaryDark} 100%)`,
                        color: "#fff",
                        borderRadius: "18px 18px 4px 18px",
                        maxWidth: "100%",
                        boxShadow: "0 2px 8px rgba(45, 95, 74, 0.20)",
                      }}
                    >
                      {m.body}
                    </Box>
                  </Stack>
                </Stack>
              ) : (
                <Stack
                  direction="row"
                  gap={0.75}
                  alignItems="flex-end"
                  sx={{ pr: 6 }}
                >
                  <UserAvatar
                    name={chat?.user ?? book?.seller}
                    seed={params.id}
                    src={chat?.partnerAvatarUrl}
                    size={28}
                  />
                  <Stack
                    sx={{
                      minWidth: 0,
                      maxWidth: "75%",
                      alignItems: "flex-start",
                      gap: 0.25,
                    }}
                  >
                    <Box
                      sx={{
                        ...bubbleBase,
                        background: palette.surface,
                        borderRadius: "18px 18px 18px 4px",
                        border: `1px solid ${palette.lineSoft}`,
                        maxWidth: "100%",
                        boxShadow: "0 1px 2px rgba(26,38,32,0.04)",
                      }}
                    >
                      {m.body}
                    </Box>
                    <Box sx={{ fontSize: 10.5, color: palette.inkSubtle }}>
                      {time}
                    </Box>
                  </Stack>
                </Stack>
              )}
            </Fragment>
          );
        })}
        <div ref={bottomRef} />
      </Box>

      <Box
        sx={{
          borderTop: `1px solid ${palette.lineSoft}`,
          px: 1.25,
          pt: 1.25,
          pb: "calc(10px + env(safe-area-inset-bottom))",
          display: "flex",
          gap: 0.75,
          alignItems: "center",
          flexShrink: 0,
          background: `linear-gradient(180deg, ${palette.surface}F2 0%, ${palette.surface} 100%)`,
          backdropFilter: "saturate(160%) blur(8px)",
          WebkitBackdropFilter: "saturate(160%) blur(8px)",
        }}
      >
        <IconButton onClick={() => toast?.show("첨부 기능은 준비 중")}>
          <AddRoundedIcon />
        </IconButton>
        <OutlinedInput
          fullWidth
          placeholder="메시지를 입력하세요"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          // 한글 IME 조합 중 Enter 는 글자 확정 키이므로 전송하지 않는다
          // (isComposing 검사 없으면 조합 글자가 잘리거나 중복 전송돼 글자가 깨져 보임)
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            if (e.nativeEvent.isComposing) return;
            e.preventDefault();
            send();
          }}
          sx={{
            background: palette.lineSoft,
            borderRadius: 999,
            "& fieldset": { border: "none" },
            "& input": { py: 1.1, fontSize: 13.5 },
            "&.Mui-focused": {
              background: palette.surface,
              boxShadow: `0 0 0 1px ${palette.line}, 0 0 0 5px ${palette.primaryGlow}`,
            },
          }}
        />
        <IconButton
          onClick={send}
          disabled={!draft.trim()}
          sx={{
            width: 44,
            height: 44,
            background: draft.trim()
              ? `linear-gradient(155deg, ${palette.primary} 0%, ${palette.primaryDark} 100%)`
              : palette.lineSoft,
            color: draft.trim() ? "#fff" : palette.inkSubtle,
            boxShadow: draft.trim() ? "0 4px 12px rgba(45, 95, 74, 0.28)" : "none",
            transition: "background 160ms ease, box-shadow 160ms ease, transform 90ms ease",
            "&:hover": {
              background: draft.trim()
                ? `linear-gradient(155deg, ${palette.primaryDark} 0%, ${palette.primaryDark} 100%)`
                : palette.lineSoft,
            },
            "&:active": { transform: "scale(0.94)" },
          }}
        >
          <SendRoundedIcon fontSize="small" />
        </IconButton>
      </Box>

    </>
  );
}

// ISO timestamp → "오후 2:35" 형태. 잘못된 값이면 빈 문자열
function formatMsgTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" });
}

// ISO timestamp → 날짜 그룹 라벨. 오늘/어제는 친근한 라벨, 그 외엔 전체 날짜.
// 잘못된 값이면 빈 문자열 → showDateSep 가 자동으로 false 가 되어 구분선이 안 그려짐.
function formatMsgDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const ymd = (x: Date) => x.toLocaleDateString("ko-KR");
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  if (ymd(d) === ymd(today)) return "오늘";
  if (ymd(d) === ymd(yesterday)) return "어제";
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// 메시지 그룹 사이 날짜 칩. 정적으로 박혀 있던 "2024년 1월 15일" 자리를 동적으로 대체.
function DateSeparator({ label }: { label: string }) {
  return (
    <Box
      sx={{
        alignSelf: "center",
        fontSize: 10.5,
        color: palette.inkSubtle,
        py: 0.4,
        px: 1.25,
        background: palette.surface,
        border: `1px solid ${palette.lineSoft}`,
        borderRadius: 999,
        fontWeight: 700,
        letterSpacing: "-0.01em",
      }}
    >
      {label}
    </Box>
  );
}
