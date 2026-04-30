"use client";

// 채팅 상세 페이지 (/chat/[id])
// - 상단: 상대 프로필 헤더 + 거래 도서 미니 카드(거래액션 버튼)
// - 본문: 시스템/내/상대 메시지 말풍선 (useRealtimeChat 훅이 messages 테이블 구독)
// - 하단: 메시지 입력창 + 전송 버튼 (sendMessage repo → DB INSERT)

import {
  Box,
  Button,
  IconButton,
  OutlinedInput,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import BookImage from "@/components/ui/BookImage";
import StatusBadge, { type SaleStatus } from "@/components/ui/StatusBadge";
import BottomSheet from "@/components/ui/BottomSheet";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { palette } from "@/lib/theme";
import { useToast } from "@/components/ui/ToastProvider";
import { useChat } from "@/lib/query/chatHooks";
import { useBook } from "@/lib/query/bookHooks";
import { useRealtimeChat } from "@/lib/realtime/useRealtimeChat";
import { markRoomMessagesRead } from "@/lib/repo";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";

const ACTIONS = [
  { key: "reserve", label: "예약하기" },
  { key: "complete", label: "거래완료" },
  { key: "cancel", label: "취소" },
];

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
  const [status, setStatus] = useState<SaleStatus>("selling");
  const [actionsOpen, setActionsOpen] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);

  // 새 메시지 들어오면 자동 스크롤 (가장 마지막 메시지가 보이도록)
  const bottomRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs.length]);

  // 채팅방을 보고 있는 동안 상대 메시지를 읽음으로 마킹
  // - 마운트 직후 1회 + 새 메시지가 도착할 때마다 호출 (read_at IS NULL 조건이라 idempotent)
  // - 갱신된 행이 있으면 채팅 목록 unread 카운트 캐시도 무효화
  const qc = useQueryClient();
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const n = await markRoomMessagesRead(params.id);
      if (cancelled) return;
      if (n > 0) qc.invalidateQueries({ queryKey: queryKeys.chat.list() });
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id, msgs.length, qc]);

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

  // 거래 액션 BottomSheet 에서 항목을 골랐을 때의 처리 (예약/완료/취소)
  const onAction = (key: string) => {
    setActionsOpen(false);
    if (key === "reserve") {
      setStatus("reserved");
      toast?.show("예약으로 변경되었어요");
    }
    if (key === "complete") setConfirmComplete(true);
    if (key === "cancel") {
      setStatus("selling");
      toast?.show("판매중으로 되돌렸어요");
    }
  };

  return (
    <>
      <Box
        sx={{
          height: 56,
          borderBottom: `1px solid ${palette.line}`,
          display: "flex",
          alignItems: "center",
          px: 1,
          gap: 1,
          flexShrink: 0,
          background: palette.surface,
        }}
      >
        <IconButton onClick={() => router.back()}>
          <ArrowBackIosNewRoundedIcon fontSize="small" />
        </IconButton>
        <BookImage seed={chat?.user ?? book?.seller ?? "seller"} width={36} height={36} radius={999} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 800 }}>
            {chat?.user ?? book?.seller ?? "판매자"}
          </Typography>
          <Typography sx={{ fontSize: 11, color: palette.inkSubtle }}>
            {book?.region ?? book?.loc ?? "마포구"} · 매너온도 38.6℃
          </Typography>
        </Box>
        <IconButton onClick={() => toast?.show("준비 중이에요")}>
          <MoreVertRoundedIcon />
        </IconButton>
      </Box>

      <Box
        sx={{
          background: palette.surface,
          p: "10px 12px",
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          borderBottom: `1px solid ${palette.line}`,
          flexShrink: 0,
        }}
      >
        <BookImage seed={book?.id ?? params.id} width={44} height={56} radius={8} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" gap={0.5}>
            <StatusBadge status={status} size="sm" />
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
        <Button
          size="small"
          variant="outlined"
          onClick={() => setActionsOpen(true)}
        >
          거래액션
        </Button>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: "16px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 1,
          background: palette.bg,
        }}
      >
        <Box sx={{ textAlign: "center", fontSize: 11, color: palette.inkSubtle, py: 1 }}>
          2024년 1월 15일
        </Box>
        {msgs.map((m) => {
          const time = formatMsgTime(m.createdAt);
          if (m.type === "system") {
            return (
              <Box
                key={m.id}
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
          return m.mine ? (
            <Stack
              key={m.id}
              direction="row"
              gap={0.75}
              alignItems="flex-end"
              justifyContent="flex-end"
              sx={{ pl: 6 }}
            >
              <Box sx={{ fontSize: 10.5, color: palette.inkSubtle, flexShrink: 0 }}>
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
                    background: palette.primary,
                    color: "#fff",
                    borderRadius: "16px 16px 4px 16px",
                    maxWidth: "100%",
                  }}
                >
                  {m.body}
                </Box>
              </Stack>
            </Stack>
          ) : (
            <Stack
              key={m.id}
              direction="row"
              gap={0.75}
              alignItems="flex-end"
              sx={{ pr: 6 }}
            >
              <BookImage
                seed={chat?.user ?? book?.seller ?? "seller"}
                width={28}
                height={28}
                radius={999}
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
                    borderRadius: "16px 16px 16px 4px",
                    border: `1px solid ${palette.line}`,
                    maxWidth: "100%",
                  }}
                >
                  {m.body}
                </Box>
                <Box sx={{ fontSize: 10.5, color: palette.inkSubtle }}>
                  {time}
                </Box>
              </Stack>
            </Stack>
          );
        })}
        <div ref={bottomRef} />
      </Box>

      <Box
        className="safe-bottom"
        sx={{
          borderTop: `1px solid ${palette.line}`,
          p: 1,
          display: "flex",
          gap: 0.75,
          alignItems: "center",
          flexShrink: 0,
          background: palette.surface,
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
            "& input": { py: 1, fontSize: 13.5 },
          }}
        />
        <IconButton
          onClick={send}
          sx={{
            background: draft.trim() ? palette.primary : palette.lineSoft,
            color: draft.trim() ? "#fff" : palette.inkSubtle,
            "&:hover": {
              background: draft.trim() ? palette.primaryDark : palette.lineSoft,
            },
          }}
        >
          <SendRoundedIcon fontSize="small" />
        </IconButton>
      </Box>

      <BottomSheet
        open={actionsOpen}
        onClose={() => setActionsOpen(false)}
        title="거래 액션"
      >
        <Stack gap={1} pb={2}>
          {ACTIONS.map((a) => (
            <Button
              key={a.key}
              variant="outlined"
              fullWidth
              sx={{ justifyContent: "flex-start", minHeight: 48, fontSize: 14 }}
              onClick={() => onAction(a.key)}
            >
              {a.label}
            </Button>
          ))}
        </Stack>
      </BottomSheet>

      <ConfirmDialog
        open={confirmComplete}
        onCancel={() => setConfirmComplete(false)}
        onConfirm={() => {
          setConfirmComplete(false);
          setStatus("sold");
          toast?.show("거래완료로 처리됐어요");
          router.push(`/orders/${params.id}/review`);
        }}
        title="거래를 완료할까요?"
        description="후기 작성 페이지로 이동해요."
        confirmLabel="완료"
      />
    </>
  );
}

// ISO timestamp → "오후 2:35" 형태. 잘못된 값이면 빈 문자열
function formatMsgTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" });
}
