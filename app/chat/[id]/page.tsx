"use client";

// 채팅 상세 페이지 (/chat/[id])
// - 상단: 상대 프로필 헤더 + 거래 도서 미니 카드(거래액션 버튼)
// - 본문: 시스템/내/상대 메시지 말풍선
// - 하단: 메시지 입력창 + 전송 버튼
// TODO: 메시지/방 상태 모두 클라이언트 상태(useState)에 머물러 있음.
//       useRealtimeChat 훅으로 messages 테이블을 구독하고, 전송도 INSERT 로 교체 필요

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
import { useEffect, useState } from "react";
import BookImage from "@/components/ui/BookImage";
import StatusBadge, { type SaleStatus } from "@/components/ui/StatusBadge";
import BottomSheet from "@/components/ui/BottomSheet";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { palette } from "@/lib/theme";
import { useToast } from "@/components/ui/ToastProvider";
import { fetchBook, fetchChat, type BookDetail, type ChatRow } from "@/lib/repo";

// 화면에 그릴 메시지 형태 — system 은 "거래 시작됨" 같은 안내 말풍선용
interface Msg {
  id: number;
  mine: boolean;
  text?: string;
  time: string;
  read?: boolean;
  type?: "text" | "system";
}

// 첫 진입 시 보여줄 더미 대화. Realtime 연동 후에는 빈 배열로 시작 → 서버에서 받아옴
const INIT_MSGS: Msg[] = [
  { id: 0, mine: false, type: "system", text: "거래가 시작되었어요", time: "" },
  {
    id: 1,
    mine: false,
    text: "안녕하세요! 채식주의자 아직 판매 중인가요?",
    time: "오후 2:30",
  },
  {
    id: 2,
    mine: true,
    text: "네 판매 중이에요! 깨끗해요 :)",
    time: "오후 2:35",
    read: true,
  },
  {
    id: 3,
    mine: false,
    text: "내일 합정역에서 직거래 가능할까요?",
    time: "오후 2:38",
  },
  {
    id: 4,
    mine: true,
    text: "네 좋아요! 내일 2시에 합정역에서 만나요",
    time: "오후 2:40",
    read: true,
  },
];

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
  const [chat, setChat] = useState<ChatRow | null>(null);
  const [book, setBook] = useState<BookDetail | null>(null);
  useEffect(() => {
    let mounted = true;
    fetchChat(params.id).then(async (c) => {
      if (!mounted) return;
      setChat(c);
      const bookId = c?.bookId ?? params.id;
      const b = await fetchBook(bookId);
      if (mounted) setBook(b);
    });
    return () => {
      mounted = false;
    };
  }, [params.id]);
  const [msgs, setMsgs] = useState<Msg[]>(INIT_MSGS);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<SaleStatus>("selling");
  const [actionsOpen, setActionsOpen] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);

  // 메시지 전송 — 빈 문자열은 무시하고, 보낸 직후 입력창 비우기
  // TODO: 실제로는 messages 테이블 INSERT 후 Realtime 으로 양쪽에 반영되어야 함
  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setMsgs((m) => [
      ...m,
      {
        id: m.length + 1,
        mine: true,
        text,
        time: new Date().toLocaleTimeString("ko-KR", {
          hour: "numeric",
          minute: "2-digit",
        }),
        read: false,
      },
    ]);
    setDraft("");
  };

  // 거래 액션 BottomSheet 에서 항목을 골랐을 때의 처리 (예약/완료/취소)
  const onAction = (key: string) => {
    setActionsOpen(false);
    if (key === "reserve") {
      setStatus("reserved");
      setMsgs((m) => [
        ...m,
        { id: m.length + 1, mine: true, type: "system", text: "예약 처리되었어요", time: "" },
      ]);
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
                {m.text}
              </Box>
            );
          }
          return m.mine ? (
            <Stack
              key={m.id}
              direction="row"
              gap={0.75}
              alignItems="flex-end"
              justifyContent="flex-end"
              sx={{ pl: 6 }}
            >
              <Box sx={{ fontSize: 10.5, color: palette.inkSubtle }}>
                {m.read ? "읽음 · " : ""}
                {m.time}
              </Box>
              <Box
                sx={{
                  maxWidth: "70%",
                  background: palette.primary,
                  color: "#fff",
                  borderRadius: "16px 16px 4px 16px",
                  p: "9px 13px",
                  fontSize: 13.5,
                  lineHeight: 1.5,
                }}
              >
                {m.text}
              </Box>
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
              <Box>
                <Box
                  sx={{
                    maxWidth: "70%",
                    background: palette.surface,
                    borderRadius: "16px 16px 16px 4px",
                    p: "9px 13px",
                    fontSize: 13.5,
                    lineHeight: 1.5,
                    border: `1px solid ${palette.line}`,
                  }}
                >
                  {m.text}
                </Box>
                <Box sx={{ fontSize: 10.5, color: palette.inkSubtle, mt: 0.25 }}>
                  {m.time}
                </Box>
              </Box>
            </Stack>
          );
        })}
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
          onKeyDown={(e) => e.key === "Enter" && send()}
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
