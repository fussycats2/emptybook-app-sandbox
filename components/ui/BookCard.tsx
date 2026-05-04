"use client";

// 책 카드 컴포넌트 모음 — 표시 형태별로 3가지 변형을 제공
// - BookFeedItem: 홈 피드용 가로 큰 썸네일 + 상세
// - BookGridCard: 검색/그리드용 정사각형 카드
// - BookListRow: 목록형 작은 썸네일

import { Box, Stack, Typography } from "@mui/material";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import { useRouter } from "next/navigation";
import BookImage from "./BookImage";
import StatusBadge, { type SaleStatus } from "./StatusBadge";
import LikeButton from "./LikeButton";
import { palette, radius, shadow } from "@/lib/theme";

// 카드에 필요한 최소 정보 — repo.ts 의 변환 함수가 이 형태로 데이터를 만들어 넘김
export interface BookSummary {
  id: string;
  title: string;
  author: string;
  price: string;
  state: string;
  date?: string;
  loc?: string;
  publisher?: string;
  status?: SaleStatus;
  free?: boolean;
  likes?: number;
  chats?: number;
  coverUrl?: string; // 외부 표지 URL — 있으면 placeholder 대신 표시
}

// 카드에 표시할 가격 텍스트 결정 — 무료나눔이면 "무료나눔" 레이블 우선
function priceLine(book: BookSummary) {
  if (book.free || book.status === "free") return "무료나눔";
  return book.price;
}

// 홈 피드 한 줄: 큰 이미지 + 제목/저자/위치 + 가격 + 좋아요/채팅 카운트
export function BookFeedItem({ book }: { book: BookSummary }) {
  const router = useRouter();
  const status: SaleStatus | undefined =
    book.status ?? (book.free ? "free" : undefined);
  return (
    <Box
      onClick={() => router.push(`/books/${book.id}`)}
      sx={{
        display: "flex",
        gap: 1.75,
        py: 2,
        px: 2,
        borderBottom: `1px solid ${palette.lineSoft}`,
        cursor: "pointer",
        transition: "background 160ms ease",
        "&:hover": { background: palette.surfaceAlt },
        "&:active": { background: palette.lineSoft },
      }}
    >
      <Box
        sx={{
          position: "relative",
          flexShrink: 0,
          borderRadius: `${radius.md}px`,
          overflow: "hidden",
          boxShadow: shadow.card,
        }}
      >
        <BookImage seed={book.id} src={book.coverUrl} width={108} height={132} radius={radius.md} />
      </Box>
      <Stack flex={1} minWidth={0} justifyContent="space-between">
        <Box>
          <Stack
            direction="row"
            gap={0.75}
            alignItems="center"
            mb={0.5}
            sx={{ minWidth: 0 }}
          >
            {status && <StatusBadge status={status} size="sm" />}
            <Typography
              noWrap
              sx={{
                fontSize: 11,
                color: palette.inkSubtle,
                fontWeight: 600,
                minWidth: 0,
                flex: 1,
                letterSpacing: "-0.01em",
              }}
            >
              {book.author}
            </Typography>
          </Stack>
          <Typography
            sx={{
              fontSize: 15.5,
              fontWeight: 700,
              color: palette.ink,
              lineHeight: 1.4,
              letterSpacing: "-0.02em",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              wordBreak: "break-word",
            }}
          >
            {book.title}
          </Typography>
          {(book.loc || book.date) && (
            <Stack
              direction="row"
              gap={0.5}
              alignItems="center"
              sx={{ mt: 0.6, color: palette.inkSubtle, fontSize: 11 }}
            >
              {book.loc && (
                <>
                  <LocationOnRoundedIcon sx={{ fontSize: 13 }} />
                  <span>{book.loc}</span>
                </>
              )}
              {book.loc && book.date && <span>·</span>}
              {book.date && <span>{book.date}</span>}
            </Stack>
          )}
        </Box>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
          <Typography
            sx={{
              fontSize: 17,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: book.free ? palette.accent : palette.ink,
            }}
          >
            {priceLine(book)}
          </Typography>
          <Stack direction="row" gap={1.25} alignItems="center" sx={{ color: palette.inkSubtle, fontSize: 11 }}>
            {(book.chats ?? 0) > 0 && (
              <Stack direction="row" gap={0.3} alignItems="center">
                <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 13 }} />
                {book.chats}
              </Stack>
            )}
            <Stack direction="row" gap={0.3} alignItems="center">
              <FavoriteBorderRoundedIcon sx={{ fontSize: 13 }} />
              {book.likes ?? 0}
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}

// 검색 결과 등에서 사용하는 정사각형 카드 (2열 그리드 친화적)
export function BookGridCard({ book }: { book: BookSummary }) {
  const router = useRouter();
  const status: SaleStatus | undefined =
    book.status ?? (book.free ? "free" : undefined);
  return (
    <Box
      onClick={() => router.push(`/books/${book.id}`)}
      sx={{
        cursor: "pointer",
        background: palette.surface,
        borderRadius: `${radius.md}px`,
        overflow: "hidden",
        border: `1px solid ${palette.lineSoft}`,
        transition: "transform 200ms cubic-bezier(0.22, 1, 0.36, 1), border-color 160ms ease, box-shadow 200ms ease",
        "&:hover": {
          borderColor: palette.line,
          transform: "translateY(-2px)",
          boxShadow: shadow.cardHover,
        },
        "&:active": { transform: "scale(0.985)" },
      }}
    >
      <Box sx={{ position: "relative" }}>
        <BookImage seed={book.id} src={book.coverUrl} ratio={1} radius={0} />
        {status && (
          <Box sx={{ position: "absolute", top: 8, left: 8 }}>
            <StatusBadge status={status} size="sm" />
          </Box>
        )}
        <Box sx={{ position: "absolute", top: 4, right: 4 }}>
          <LikeButton bookId={book.id} size="small" bg="rgba(255,255,255,0.92)" />
        </Box>
      </Box>
      <Box sx={{ p: 1.5 }}>
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {book.title}
        </Typography>
        <Typography
          sx={{ fontSize: 11, color: palette.inkSubtle, mt: 0.25 }}
        >
          {book.author}
        </Typography>
        <Typography
          sx={{
            fontSize: 14.5,
            fontWeight: 800,
            mt: 0.6,
            letterSpacing: "-0.02em",
            color: book.free ? palette.accent : palette.ink,
          }}
        >
          {priceLine(book)}
        </Typography>
      </Box>
    </Box>
  );
}

// 마이페이지 거래내역 같은 곳에서 사용하는 컴팩트 가로 행
export function BookListRow({ book }: { book: BookSummary }) {
  const router = useRouter();
  return (
    <Box
      onClick={() => router.push(`/books/${book.id}`)}
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
      <BookImage seed={book.id} src={book.coverUrl} width={68} height={88} radius={12} />
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
          {book.title}
        </Typography>
        <Typography sx={{ fontSize: 11.5, color: palette.inkSubtle, mt: 0.25 }}>
          {book.author}
          {book.publisher ? ` · ${book.publisher}` : ""}
        </Typography>
        <Stack direction="row" gap={0.75} mt={0.85} alignItems="center">
          <Typography sx={{ fontSize: 14.5, fontWeight: 800, letterSpacing: "-0.02em" }}>
            {book.price}
          </Typography>
          <Box
            sx={{
              fontSize: 10.5,
              border: `1px solid ${palette.line}`,
              background: palette.lineSoft,
              px: 0.85,
              py: 0.25,
              borderRadius: 999,
              color: palette.inkMute,
              fontWeight: 700,
            }}
          >
            {book.state}
          </Box>
        </Stack>
        {(book.loc || book.date) && (
          <Typography sx={{ fontSize: 11, color: palette.inkSubtle, mt: 0.5 }}>
            {[book.loc, book.date].filter(Boolean).join(" · ")}
          </Typography>
        )}
      </Box>
      <Box sx={{ alignSelf: "flex-start" }}>
        <LikeButton bookId={book.id} size="small" />
      </Box>
    </Box>
  );
}

// 이전 이름으로 import 하던 곳들이 있어서 alias 로 유지(별도 동작 동일)
export function BookListItem(props: { book: BookSummary }) {
  return <BookListRow {...props} />;
}
