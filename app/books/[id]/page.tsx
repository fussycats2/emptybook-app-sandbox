"use client";

// 도서 상세 페이지 (/books/[id])
// - 캐러셀 + 판매자 카드 + 가격/상태 + 도서 정보 + 코멘트 + 관련 도서
// - 푸터: 찜 + 채팅 + 구매하기/신청하기 버튼
// - 본인 책이거나 거래완료 상태면 구매 버튼 비활성화

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
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ScrollBody, FixedFooter } from "@/components/ui/Section";
import ImageCarousel from "@/components/ui/ImageCarousel";
import StatusBadge from "@/components/ui/StatusBadge";
import MannerTemperature from "@/components/ui/MannerTemperature";
import LikeButton from "@/components/ui/LikeButton";
import BookImage from "@/components/ui/BookImage";
import BottomSheet from "@/components/ui/BottomSheet";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  useBook,
  useCancelBook,
  useDeleteBook,
  useRecentBooks,
} from "@/lib/query/bookHooks";
import { useGetOrCreateChatRoom } from "@/lib/query/chatHooks";
import { palette } from "@/lib/theme";
import { useToast } from "@/components/ui/ToastProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useLikesStore, selectLikeCount } from "@/lib/store/likesStore";
import { useRecentlyViewedStore } from "@/lib/store/recentlyViewedStore";

export default function BookDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  // React Query — 도서 상세 + 관련(최근) 도서. 같은 캐시를 다른 화면도 공유
  const { data: book } = useBook(id);
  const { data: recent } = useRecentBooks(8);
  const related = (recent ?? []).filter((x) => x.id !== id);
  const cancelMutation = useCancelBook();
  const deleteMutation = useDeleteBook();
  const chatRoom = useGetOrCreateChatRoom();

  const [scrolled, setScrolled] = useState(false);
  // 찜 카운트 — Zustand store 에서 구독해 다른 화면(예: 카드 LikeButton)
  // 에서의 토글에도 자동 반영. store 가 비어 있으면 book.likes 로 폴백.
  const storeCount = useLikesStore(selectLikeCount(id));
  const setLikeCountInStore = useLikesStore((s) => s.setCount);
  const likeCount = storeCount ?? book?.likes ?? 0;
  // 본인 책일 때 MoreVert 메뉴(시트) + 취소/삭제 확인 다이얼로그 상태
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirm, setConfirm] = useState<null | "cancel" | "delete">(null);
  const busy = cancelMutation.isPending || deleteMutation.isPending;
  const chatBusy = chatRoom.isPending;

  // "채팅" 버튼 클릭 — 책 ID 가 아니라 chat_rooms.id 로 라우팅해야 RLS 통과
  const handleStartChat = async () => {
    if (!book || chatBusy) return;
    const res = await chatRoom.mutateAsync(book.id);
    if ("error" in res) {
      if (res.error === "self") toast?.show("내 책에는 채팅을 보낼 수 없어요");
      else if (res.error === "book_not_found")
        toast?.show("도서 정보를 찾을 수 없어요", "error");
      else toast?.show("채팅방을 만들 수 없어요", "error");
      return;
    }
    router.push(`/chat/${res.id}`);
  };

  // book 이 처음 로드되면 store 에 카운트 시드 — 이미 store 값이 있으면 유지
  useEffect(() => {
    if (book && useLikesStore.getState().counts[id] == null) {
      setLikeCountInStore(id, book.likes ?? 0);
    }
  }, [book, id, setLikeCountInStore]);

  // "최근 본 상품" 추적 — 책이 실제로 로드된 시점에만 push (404/null 이면 기록 X)
  // book 객체 참조가 바뀔 때마다 push 가 호출되지만, store 가 같은 id 면 move-to-front 로 처리
  const pushRecent = useRecentlyViewedStore((s) => s.push);
  useEffect(() => {
    if (book?.id) pushRecent(book.id);
  }, [book?.id, pushRecent]);

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

  // 표시할 상태값과 푸터 버튼 비활성 조건 계산
  // 우선순위: 1) Supabase 모드 → auth.uid === sellerId, 2) mock 모드 → seller==="나"
  const status = book.status ?? (book.free ? "free" : "selling");
  const isMine = book.sellerId
    ? !!user && book.sellerId === user.id
    : book.seller === "나";
  const isSold = status === "sold";
  const isCanceled = status === "canceled";
  // 거래완료/취소된 책은 본인이 아니어도 구매 불가
  const ctaDisabled = isMine || isSold || isCanceled;

  // "판매 취소" — books.status → HIDDEN. 매물 목록/검색에서 사라지지만 데이터는 보존
  const handleCancel = async () => {
    if (busy || !book) return;
    const ok = await cancelMutation.mutateAsync(book.id);
    setConfirm(null);
    setMenuOpen(false);
    if (ok) {
      toast?.show("판매를 취소했어요");
      router.replace("/mypage/selling");
      router.refresh();
    } else {
      toast?.show("취소에 실패했어요");
    }
  };

  // "삭제" — 영구 삭제. 거래 이력이 있어 RESTRICT 로 막히면 cancelBook 으로 폴백
  const handleDelete = async () => {
    if (busy || !book) return;
    const deleted = await deleteMutation.mutateAsync(book.id);
    if (!deleted) {
      const hidden = await cancelMutation.mutateAsync(book.id);
      setConfirm(null);
      setMenuOpen(false);
      if (hidden) {
        toast?.show("거래 이력이 있어 숨김 처리했어요");
        router.replace("/mypage/selling");
        router.refresh();
      } else {
        toast?.show("삭제에 실패했어요");
      }
      return;
    }
    setConfirm(null);
    setMenuOpen(false);
    toast?.show("삭제했어요");
    router.replace("/mypage/selling");
    router.refresh();
  };

  return (
    <>
      {/* 상단 헤더: 처음에는 투명 + 흰 아이콘, 스크롤되면 흰 배경 + 어두운 아이콘으로 전환 */}
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
            color: palette.ink,
            fontSize: 16,
            opacity: scrolled ? 1 : 0,
            transition: "opacity 200ms",
            ml: 0.5,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
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
        <IconButton
          onClick={() => {
            if (isMine) setMenuOpen(true);
            else toast?.show("준비중이에요");
          }}
          sx={{ color: scrolled ? palette.ink : "#fff" }}
        >
          <MoreVertRoundedIcon />
        </IconButton>
      </Box>

      {/* 200px 스크롤되면 헤더 스타일을 전환하는 트리거 */}
      <ScrollBody
        sx={{ background: palette.surface }}
        onScroll={(e: any) => setScrolled(e.target.scrollTop > 200)}
      >
        <ImageCarousel
          seed={book.id}
          count={4}
          height={380}
          coverUrl={book.coverUrl}
          imageUrls={book.imageUrls}
        />

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
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                {book.seller || "책방마니아"}
              </Typography>
              <Stack
                direction="row"
                alignItems="center"
                gap={0.25}
                sx={{ color: palette.inkSubtle, fontSize: 11.5, mt: 0.25 }}
              >
                <LocationOnRoundedIcon sx={{ fontSize: 13 }} />
                <span>{book.loc ?? "마포구"}</span>
              </Stack>
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
              조회 {32 + (book.likes ?? 0) * 5}
            </Stack>
            <Stack direction="row" gap={0.4} alignItems="center">
              <FavoriteBorderRoundedIcon sx={{ fontSize: 14 }} />
              찜 {likeCount}
            </Stack>
            <Stack direction="row" gap={0.4} alignItems="center">
              <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 14 }} />
              채팅 {book.chats ?? 0}
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
            <LikeButton bookId={book.id} size="small" />
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
            onClick={handleStartChat}
            disabled={chatBusy}
          >
            채팅
          </Button>
          <Button
            variant="contained"
            sx={{ minWidth: 110 }}
            disabled={ctaDisabled}
            onClick={() => router.push(`/checkout/${book.id}`)}
          >
            {isCanceled
              ? "판매 종료"
              : isSold
              ? "거래완료"
              : isMine
              ? "내 책"
              : book.free
              ? "신청하기"
              : "구매하기"}
          </Button>
        </Stack>
      </FixedFooter>

      {/* 본인 책 관리 시트: 수정(미구현) / 판매 취소 / 삭제 */}
      <BottomSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="이 게시글 관리"
      >
        <Stack divider={<Divider />}>
          <SheetRow
            icon={<EditRoundedIcon />}
            label="게시글 수정"
            sub="준비중"
            disabled
            onClick={() => toast?.show("준비중이에요")}
          />
          <SheetRow
            icon={<VisibilityOffRoundedIcon />}
            label="판매 취소"
            sub="목록에서 숨겨요. 데이터는 남아요."
            onClick={() => setConfirm("cancel")}
          />
          <SheetRow
            icon={<DeleteOutlineRoundedIcon />}
            label="삭제"
            sub="되돌릴 수 없어요"
            destructive
            onClick={() => setConfirm("delete")}
          />
        </Stack>
      </BottomSheet>

      <ConfirmDialog
        open={confirm === "cancel"}
        title="판매를 취소할까요?"
        description="목록과 검색에서 더 이상 보이지 않아요. 다시 올리려면 새로 등록해야 해요."
        confirmLabel={busy ? "처리중…" : "판매 취소"}
        onCancel={() => setConfirm(null)}
        onConfirm={handleCancel}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        destructive
        title="이 게시글을 삭제할까요?"
        description="삭제하면 되돌릴 수 없어요. 거래 이력이 있으면 자동으로 숨김 처리돼요."
        confirmLabel={busy ? "처리중…" : "삭제"}
        onCancel={() => setConfirm(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}

// 본인 책 관리 시트의 한 줄 — 아이콘 + 라벨 + 보조 설명
function SheetRow({
  icon,
  label,
  sub,
  destructive,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  destructive?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={1.5}
      onClick={disabled ? undefined : onClick}
      sx={{
        py: 1.5,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
        color: destructive ? palette.accent : palette.ink,
      }}
    >
      <Box sx={{ display: "grid", placeItems: "center", width: 24 }}>{icon}</Box>
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontSize: 14.5, fontWeight: 700 }}>{label}</Typography>
        {sub && (
          <Typography sx={{ fontSize: 11.5, color: palette.inkSubtle, mt: 0.25 }}>
            {sub}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

// "도서 정보" 섹션의 라벨/값 한 줄을 그리는 헬퍼
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
