"use client";

import {
  Box,
  Button,
  IconButton,
  Stack,
  Typography,
  Divider,
} from "@mui/material";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ScrollBody, FixedFooter } from "@/components/ui/Section";
import ImageCarousel from "@/components/ui/ImageCarousel";
import StatusBadge from "@/components/ui/StatusBadge";
import MannerTemperature from "@/components/ui/MannerTemperature";
import LikeButton from "@/components/ui/LikeButton";
import BookImage from "@/components/ui/BookImage";
import { fetchBook, listRecentBooks, type BookDetail } from "@/lib/repo";
import type { BookSummary } from "@/components/ui/BookCard";
import { palette } from "@/lib/theme";
import { useToast } from "@/components/ui/ToastProvider";

export default function BookDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const toast = useToast();
  const [book, setBook] = useState<BookDetail | null>(null);
  const [related, setRelated] = useState<BookSummary[]>([]);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchBook(id).then((b) => mounted && setBook(b));
    listRecentBooks(8).then((list) => {
      if (!mounted) return;
      setRelated(list.filter((x) => x.id !== id));
    });
    return () => {
      mounted = false;
    };
  }, [id]);

  if (!book) {
    return (
      <Box
        sx={{
          flex: 1,
          display: "grid",
          placeItems: "center",
          color: palette.inkSubtle,
        }}
      >
        불러오는 중…
      </Box>
    );
  }

  const status = book.status ?? (book.free ? "free" : "selling");
  const isMine = book.seller === "나";
  const isSold = status === "sold";
  const ctaDisabled = isMine || isSold;

  return (
    <>
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 5,
          background: scrolled
            ? palette.surface
            : "linear-gradient(180deg, rgba(0,0,0,0.28) 0%, transparent 100%)",
          borderBottom: scrolled ? `1px solid ${palette.line}` : "none",
          transition: "background 200ms",
          display: "flex",
          alignItems: "center",
          height: 56,
          px: 1,
        }}
      >
        <IconButton
          onClick={() => router.back()}
          sx={{ color: scrolled ? palette.ink : "#fff" }}
        >
          <ArrowBackIosNewRoundedIcon fontSize="small" />
        </IconButton>
        <Typography
          sx={{
            flex: 1,
            fontWeight: 700,
            color: scrolled ? palette.ink : "transparent",
            fontSize: 16,
            transition: "color 200ms",
            ml: 0.5,
          }}
        >
          {book.title}
        </Typography>
        <IconButton
          onClick={() => toast?.show("링크를 복사했어요")}
          sx={{ color: scrolled ? palette.ink : "#fff" }}
        >
          <IosShareRoundedIcon fontSize="small" />
        </IconButton>
        <IconButton sx={{ color: scrolled ? palette.ink : "#fff" }}>
          <MoreVertRoundedIcon />
        </IconButton>
      </Box>

      <ScrollBody
        sx={{ background: palette.surface }}
        onScroll={(e: any) => setScrolled(e.target.scrollTop > 200)}
      >
        <ImageCarousel seed={book.id} count={4} height={380} />

        <Box sx={{ p: 2 }}>
          <Stack
            direction="row"
            gap={1.25}
            alignItems="center"
            sx={{
              borderRadius: 3,
              border: `1px solid ${palette.line}`,
              p: 1.25,
            }}
          >
            <BookImage seed={book.seller} width={44} height={44} radius={999} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                {book.seller || "책방마니아"}
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: palette.inkSubtle }}>
                <LocationOnRoundedIcon
                  sx={{ fontSize: 13, verticalAlign: -2, mr: 0.25 }}
                />
                {book.loc ?? "마포구"}
              </Typography>
            </Box>
            <MannerTemperature value={38.6} size="sm" />
          </Stack>

          <Box sx={{ pt: 2.5 }}>
            <Stack direction="row" gap={0.75} alignItems="center" mb={0.75}>
              <StatusBadge status={status as any} size="sm" />
              <Typography sx={{ fontSize: 12, color: palette.inkSubtle }}>
                {book.category ?? "소설"} · {book.date}
              </Typography>
            </Stack>
            <Typography sx={{ fontSize: 22, fontWeight: 800, lineHeight: 1.3 }}>
              {book.title}
            </Typography>
            <Typography sx={{ fontSize: 13, color: palette.inkMute, mt: 0.25 }}>
              {book.author}
              {book.publisher ? ` · ${book.publisher}` : ""}
            </Typography>
          </Box>

          <Box sx={{ pt: 2 }}>
            <Stack direction="row" alignItems="baseline" gap={1}>
              <Typography
                sx={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: book.free ? palette.accent : palette.ink,
                }}
              >
                {book.free ? "무료나눔" : book.price}
              </Typography>
              {book.originalPrice && (
                <Typography
                  sx={{
                    fontSize: 13,
                    color: palette.inkSubtle,
                    textDecoration: "line-through",
                  }}
                >
                  {book.originalPrice}
                </Typography>
              )}
              {book.discount && (
                <Box
                  sx={{
                    fontSize: 11.5,
                    fontWeight: 800,
                    background: palette.primarySoft,
                    color: palette.primary,
                    borderRadius: 999,
                    px: 1,
                    py: 0.25,
                  }}
                >
                  {book.discount}
                </Box>
              )}
            </Stack>
          </Box>

          <Stack
            direction="row"
            gap={2.5}
            alignItems="center"
            sx={{ pt: 1.5, color: palette.inkSubtle, fontSize: 12 }}
          >
            <Stack direction="row" gap={0.4} alignItems="center">
              <VisibilityRoundedIcon sx={{ fontSize: 14 }} />
              {(book.likes ?? 0) * 5 + 32}
            </Stack>
            <Stack direction="row" gap={0.4} alignItems="center">
              <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 14 }} />
              {book.chats ?? 1}
            </Stack>
          </Stack>
        </Box>

        <Divider />
        <Box sx={{ p: 2 }}>
          <Typography
            sx={{
              fontSize: 12.5,
              fontWeight: 800,
              color: palette.inkMute,
              mb: 1,
            }}
          >
            도서 정보
          </Typography>
          <InfoRow label="상태" value={book.state} />
          <InfoRow label="거래방식" value={book.tradeMethod ?? "직거래/택배"} />
          <InfoRow label="ISBN" value={book.isbn ?? "-"} />
          <InfoRow
            label="등록일"
            value={book.registeredAt ?? book.date ?? "-"}
          />
        </Box>

        <Divider />
        <Box sx={{ p: 2 }}>
          <Typography
            sx={{
              fontSize: 12.5,
              fontWeight: 800,
              color: palette.inkMute,
              mb: 1,
            }}
          >
            판매자 코멘트
          </Typography>
          <Typography
            sx={{ fontSize: 14, lineHeight: 1.7, color: palette.ink }}
          >
            {book.comment ??
              "한 번 정독 후 책장에 보관했던 책입니다. 깨끗하게 사용했어요. 빠른 거래 환영합니다 :)"}
          </Typography>
        </Box>

        {related.length > 0 && (
          <>
            <Divider />
            <Box sx={{ p: 2, pb: 4 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 800, mb: 1.5 }}>
                이런 책은 어때요?
              </Typography>
              <Box
                className="no-scrollbar"
                sx={{ display: "flex", gap: 1.25, overflowX: "auto" }}
              >
                {related.slice(0, 6).map((b) => (
                  <Box
                    key={b.id}
                    onClick={() => router.push(`/books/${b.id}`)}
                    sx={{ flexShrink: 0, width: 110, cursor: "pointer" }}
                  >
                    <BookImage seed={b.id} width={110} height={140} radius={10} />
                    <Typography
                      sx={{
                        fontSize: 12,
                        mt: 0.75,
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {b.title}
                    </Typography>
                    <Typography
                      sx={{ fontSize: 11.5, fontWeight: 800, mt: 0.25 }}
                    >
                      {b.free ? "무료나눔" : b.price}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </>
        )}
      </ScrollBody>

      <FixedFooter>
        <Stack direction="row" gap={1} alignItems="center">
          <Box
            sx={{
              border: `1px solid ${palette.line}`,
              borderRadius: 2,
              width: 44,
              height: 44,
              display: "grid",
              placeItems: "center",
            }}
          >
            <LikeButton size="small" />
          </Box>
          <Box sx={{ borderLeft: `1px solid ${palette.line}`, height: 32 }} />
          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{
                fontSize: 17,
                fontWeight: 800,
                color: book.free ? palette.accent : palette.ink,
              }}
            >
              {book.free ? "무료나눔" : book.price}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            sx={{ minWidth: 80 }}
            onClick={() => router.push(`/chat/${book.id}`)}
          >
            채팅
          </Button>
          <Button
            variant="contained"
            sx={{ minWidth: 110 }}
            disabled={ctaDisabled}
            onClick={() => router.push(`/checkout/${book.id}`)}
          >
            {isSold ? "거래완료" : isMine ? "내 책" : book.free ? "신청하기" : "구매하기"}
          </Button>
        </Stack>
      </FixedFooter>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <Stack direction="row" sx={{ py: 0.5 }}>
      <Typography sx={{ fontSize: 13, color: palette.inkSubtle, width: 80 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 13, color: palette.ink, fontWeight: 600 }}>
        {value}
      </Typography>
    </Stack>
  );
}
