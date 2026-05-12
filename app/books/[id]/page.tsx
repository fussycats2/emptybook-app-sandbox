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
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import RuleRoundedIcon from "@mui/icons-material/RuleRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ScrollBody, FixedFooter } from "@/components/ui/Section";
import ImageCarousel from "@/components/ui/ImageCarousel";
import StatusBadge from "@/components/ui/StatusBadge";
import MannerTemperature, {
  calcMannerTemperature,
} from "@/components/ui/MannerTemperature";
import LikeButton from "@/components/ui/LikeButton";
import BookImage from "@/components/ui/BookImage";
import BookLoader from "@/components/ui/BookLoader";
import BottomSheet from "@/components/ui/BottomSheet";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  useBook,
  useIncrementBookView,
  useCancelBook,
  useDeleteBook,
  useRecentBooks,
} from "@/lib/query/bookHooks";
import { useGetOrCreateChatRoom } from "@/lib/query/chatHooks";
import { useReceivedReviews } from "@/lib/query/profileHooks";
import { useAddShelfItem } from "@/lib/query/shelfHooks";
import { palette, radius } from "@/lib/theme";
import { useToast } from "@/components/ui/ToastProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useLikesStore, selectLikeCount } from "@/lib/store/likesStore";
import { useViewsStore, selectViewCount } from "@/lib/store/viewsStore";
import { useRecentlyViewedStore } from "@/lib/store/recentlyViewedStore";
import { flattenChecked, hasAnyChecked } from "@/lib/conditionGrade";
import type { ConditionDetail } from "@/lib/supabase/types";

export default function BookDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  // React Query — 도서 상세 + 관련(최근) 도서. 같은 캐시를 다른 화면도 공유
  const { data: book } = useBook(id);
  // isMine — 본인 매물 판별. book 이 아직 안 와도 false 로 안전. useEffect 안 closure 에서 참조하므로 early return 전에 둠.
  const isMine = book
    ? book.sellerId
      ? !!user && book.sellerId === user.id
      : book.seller === "나"
    : false;
  const { data: recent } = useRecentBooks(8);
  const related = (recent ?? []).filter((x) => x.id !== id);
  const cancelMutation = useCancelBook();
  const deleteMutation = useDeleteBook();
  // 판매 취소 / 삭제→cancel 폴백 시 책을 책장으로 자동 이동시키기 위해 사용
  const addShelfMutation = useAddShelfItem();
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

  // 조회수 — 찜과 같은 패턴(viewsStore + RPC)
  //  1) book 이 로드되면 store 에 시드 (이미 있으면 유지)
  //  2) book.id 가 새로 정해진 시점에 한 번만 +1 — 즉시 store(+1) + 비동기 RPC(서버 영구 반영)
  //  3) 화면은 store 값을 구독해 +1 즉시 보임. 다음 fetch 때 서버 값과 동기화.
  const seedViewCount = useViewsStore((s) => s.seed);
  const incrementViewLocal = useViewsStore((s) => s.increment);
  const liveViewCount = useViewsStore(selectViewCount(book?.id ?? id));
  const incrementView = useIncrementBookView();
  const viewedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!book) return;
    seedViewCount(book.id, book.viewCount ?? 0);
  }, [book?.id, book?.viewCount, seedViewCount]);
  useEffect(() => {
    if (!book?.id) return;
    if (viewedRef.current === book.id) return;
    viewedRef.current = book.id;
    // 본인 매물이면 store 도 +1 하지 않음 — RPC 도 내부에서 noop. UI 일관성.
    if (!isMine) incrementViewLocal(book.id);
    incrementView.mutate(book.id);
    // isMine 은 book.sellerId 가 정해진 후에야 의미가 있어서 dependency 에 포함하지 않음
    // (실제 mismatch 발생 빈도 매우 낮고, 이중 +1 발사하면 UX 가 더 나빠짐)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book?.id]);

  if (!book) {
    return (
      <Box
        sx={{
          flex: 1,
          display: "grid",
          placeItems: "center",
        }}
      >
        <BookLoader label="불러오는 중…" />
      </Box>
    );
  }

  // 표시할 상태값과 푸터 버튼 비활성 조건 계산 — isMine 은 위에서 이미 계산됨(early return 전 useEffect 가 참조)
  const status = book.status ?? (book.free ? "free" : "selling");
  const isSold = status === "sold";
  const isReserved = status === "reserved";
  const isCanceled = status === "canceled";
  // 거래완료/취소된 책은 본인이 아니어도 구매 불가
  const ctaDisabled = isMine || isSold || isCanceled;
  // 거래완료(SOLD) 책은 게시글 관리 메뉴 자체를 노출하지 않음 — 수정/취소/삭제 모두 의미 없음
  const canManage = isMine && !isSold;

  // 판매자 카드의 받은 후기 미리보기 — 본인 책이면 안 가져옴(불필요한 요청 방지).
  // mock 모드에서는 sellerId 가 없을 수 있어 항상 시드 후기로 폴백.
  // ⚠️ React 훅 규칙상 useReceivedReviews 는 컴포넌트 본문 첫 렌더부터 호출돼야 하지만,
  //    book 이 없을 때 page 가 early-return 하므로 컴포넌트 분리 없이는 호출 위치를 옮기기 어렵다.
  //    SellerCard 를 별도 컴포넌트로 빼서 그 안에서 훅을 호출 (아래 정의)

  // 책을 책장에 OWNED 로 보장 (판매 취소 시 사용).
  // 0014 트리거가 linked shelf_item 이 있으면 FOR_SALE → OWNED 로 자동 옮겨주지만,
  // 사용자가 /register 로 직접 등록한 책은 shelf 에 흔적이 없을 수 있음 → 명시적 추가.
  // ISBN UNIQUE (0012) 가 같은 책의 중복 추가를 막아 idempotent.
  const ensureBookOnShelf = async () => {
    if (!book) return;
    try {
      await addShelfMutation.mutateAsync({
        title: book.title,
        author: book.author,
        publisher: book.publisher,
        isbn: book.isbn,
        category: book.category,
        coverUrl: book.coverUrl,
        status: "OWNED",
      });
    } catch {
      /* noop — 책장 이동 실패가 cancel 자체를 막진 않음 */
    }
  };

  // "판매 취소" — books.status → HIDDEN. 매물 목록/검색에서 사라지지만 데이터는 보존.
  // 사용자 멘탈 모델: "판매 취소 = 다시 내 소유로 돌아옴" → 책장으로 redirect.
  const handleCancel = async () => {
    if (busy || !book) return;
    const ok = await cancelMutation.mutateAsync(book.id);
    setConfirm(null);
    setMenuOpen(false);
    if (ok) {
      await ensureBookOnShelf();
      toast?.show("판매를 취소하고 책장으로 옮겼어요");
      router.replace("/mypage/shelf");
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
        // 실질적으로 cancel 동작 — 책장으로 보내는 흐름과 일치시킴
        await ensureBookOnShelf();
        toast?.show("거래 이력이 있어 책장으로 옮겼어요");
        router.replace("/mypage/shelf");
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
      {/* 상단 헤더: 처음에는 투명 + 흰 아이콘, 스크롤되면 글래시 배경 + 어두운 아이콘으로 전환 */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 5,
          background: scrolled
            ? `linear-gradient(180deg, ${palette.surface} 0%, ${palette.surface}F2 100%)`
            : "linear-gradient(180deg, rgba(0,0,0,0.32) 0%, transparent 100%)",
          backdropFilter: scrolled ? "saturate(160%) blur(8px)" : "none",
          WebkitBackdropFilter: scrolled ? "saturate(160%) blur(8px)" : "none",
          borderBottom: scrolled ? `1px solid ${palette.lineSoft}` : "none",
          transition: "background 200ms ease, border-color 200ms ease",
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
          onClick={async () => {
            // 모바일 환경이면 OS 공유 시트, 아니면 클립보드 복사로 폴백.
            // 이전엔 토스트만 띄우고 실제 복사가 안 돼서 거짓말 UI 였음.
            const url = typeof window !== "undefined" ? window.location.href : "";
            if (!url) return;
            try {
              if (typeof navigator !== "undefined" && navigator.share) {
                await navigator.share({
                  title: book.title,
                  url,
                });
                return;
              }
              if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(url);
                toast?.show("링크를 복사했어요");
                return;
              }
              toast?.show("공유를 지원하지 않는 환경이에요", "warning");
            } catch {
              // 사용자가 공유 시트를 닫은 케이스도 catch 됨 — 토스트는 띄우지 않음
            }
          }}
          sx={{ color: scrolled ? palette.ink : "#fff" }}
        >
          <IosShareRoundedIcon fontSize="small" />
        </IconButton>
        {/* MoreVert — 본인 책 + 거래완료(SOLD) 가 아닐 때만 노출.
            거래완료된 책은 수정/취소/삭제 모두 무의미하므로 메뉴 자체를 숨긴다. */}
        {canManage && (
          <IconButton
            onClick={() => setMenuOpen(true)}
            sx={{ color: scrolled ? palette.ink : "#fff" }}
          >
            <MoreVertRoundedIcon />
          </IconButton>
        )}
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
            direction="column"
            sx={{
              borderRadius: `${radius.md}px`,
              border: `1px solid ${palette.lineSoft}`,
              background: palette.surfaceAlt,
              p: 1.5,
              transition: "border-color 160ms ease, background 160ms ease",
              "&:hover": { borderColor: palette.line, background: palette.surface },
            }}
          >
            <SellerCard
              sellerName={book.seller || "책방마니아"}
              sellerId={book.sellerId}
              sellerRating={book.sellerRating}
              sellerTradeCount={book.sellerTradeCount}
              sellerAvatar={book.sellerAvatar}
              loc={book.loc ?? book.region ?? "마포구"}
              isMine={isMine}
            />
          </Stack>

          <Box sx={{ pt: 2.5 }}>
            <Stack
              direction="row"
              gap={0.75}
              alignItems="center"
              mb={0.75}
              sx={{ minWidth: 0 }}
            >
              <StatusBadge status={status as any} size="sm" />
              <Typography
                noWrap
                sx={{
                  fontSize: 12,
                  color: palette.inkSubtle,
                  minWidth: 0,
                }}
              >
                {book.category ?? "소설"} · {book.date}
              </Typography>
            </Stack>
            <Typography
              sx={{
                fontSize: 24,
                fontWeight: 800,
                lineHeight: 1.3,
                letterSpacing: "-0.025em",
              }}
            >
              {book.title}
            </Typography>
            <Typography sx={{ fontSize: 13, color: palette.inkMute, mt: 0.5 }}>
              {book.author}
              {book.publisher ? ` · ${book.publisher}` : ""}
            </Typography>
          </Box>

          <Box sx={{ pt: 2.25 }}>
            <Stack direction="row" alignItems="baseline" gap={1}>
              <Typography
                sx={{
                  fontSize: 30,
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
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
              조회 {liveViewCount ?? book.viewCount ?? 0}
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
          {hasAnyChecked(book.conditionDetail) && (
            <ConditionDetailRow detail={book.conditionDetail!} />
          )}
          <InfoRow label="거래방식" value={book.tradeMethod ?? "직거래/택배"} />
          <InfoRow label="ISBN" value={book.isbn ?? "-"} />
          {book.pubDate && <InfoRow label="발행일" value={book.pubDate} />}
          <InfoRow
            label="등록일"
            value={book.registeredAt ?? book.date ?? "-"}
          />
          {book.sourceUrl && (
            <Box
              component="a"
              href={book.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                mt: 1.25,
                fontSize: 12,
                fontWeight: 700,
                color: palette.primary,
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              네이버에서 자세히 보기
              <OpenInNewRoundedIcon sx={{ fontSize: 13 }} />
            </Box>
          )}
        </Box>

        {book.synopsis && (
          <>
            <Divider />
            <SynopsisSection text={book.synopsis} />
          </>
        )}

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
                    {/* coverUrl 이 있으면 (네이버 도서 API 등록 시 자동 저장된 표지) 그걸 사용,
                        없으면 BookImage 가 seed 기반 placeholder 로 폴백 */}
                    <BookImage
                      seed={b.id}
                      src={b.coverUrl}
                      width={110}
                      height={140}
                      radius={10}
                    />
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
              transition: "border-color 160ms ease, background 160ms ease",
              "&:hover": { borderColor: palette.accent, background: palette.accentSoft },
            }}
          >
            <LikeButton bookId={book.id} size="small" />
          </Box>
          <Box sx={{ borderLeft: `1px solid ${palette.lineSoft}`, height: 32 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: 11,
                color: palette.inkSubtle,
                fontWeight: 600,
                letterSpacing: "-0.01em",
              }}
            >
              총 결제 금액
            </Typography>
            <Typography
              sx={{
                fontSize: 17,
                fontWeight: 800,
                letterSpacing: "-0.02em",
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
            sx={{ minWidth: 116 }}
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
            sub="가격·상태·설명을 바꿀 수 있어요"
            onClick={() => {
              setMenuOpen(false);
              router.push(`/register?editId=${book.id}`);
            }}
          />
          <SheetRow
            icon={<VisibilityOffRoundedIcon />}
            label="판매 취소"
            sub="다시 내 책장으로 옮겨져요"
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
        description="목록과 검색에서 사라지고, 책은 다시 내 책장으로 옮겨져요. 다시 올리려면 새로 등록해야 해요."
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

// 책 소개(synopsis) — 5줄 클램프 + "더 보기" 토글
// 텍스트가 5줄을 안 넘으면 토글 자체를 숨겨 카드가 깔끔하게 끝나게 한다.
// scrollHeight 비교는 폰트 로드/리사이즈 후에도 안전하도록 ResizeObserver 로 추적.
const SYNOPSIS_LINE_CLAMP = 5;

function SynopsisSection({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [overflow, setOverflow] = useState(false);
  const ref = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      // expanded 상태에서는 clamp 가 풀려 항상 fit 하므로 측정 의미가 없음.
      // 다음 collapse 진입 시 다시 재 측정되도록 일단 그대로 둔다.
      if (expanded) return;
      setOverflow(el.scrollHeight - el.clientHeight > 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text, expanded]);

  return (
    <Box sx={{ p: 2 }}>
      <Typography
        sx={{
          fontSize: 12.5,
          fontWeight: 800,
          color: palette.inkMute,
          mb: 1,
        }}
      >
        책 소개
      </Typography>
      <Typography
        ref={ref}
        sx={{
          fontSize: 14,
          lineHeight: 1.7,
          color: palette.inkMute,
          whiteSpace: "pre-wrap",
          ...(expanded
            ? {}
            : {
                display: "-webkit-box",
                WebkitLineClamp: SYNOPSIS_LINE_CLAMP,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }),
        }}
      >
        {text}
      </Typography>
      {overflow && (
        <Typography
          onClick={() => setExpanded((v) => !v)}
          sx={{
            mt: 1,
            display: "inline-block",
            fontSize: 12.5,
            fontWeight: 700,
            color: palette.primary,
            cursor: "pointer",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          {expanded ? "접기" : "더 보기"}
        </Typography>
      )}
    </Box>
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

// 0013 — "도서 정보" 의 "상태" InfoRow 아래에 끼워 넣는 토글 섹션.
// 판매자가 등록 시 체크한 상세 항목을 카테고리별로 칩 형태로 노출 — 분쟁 시 객관적 근거.
// 기본 접힘 + "상세 보기" 클릭 시 펼쳐짐. 체크된 항목이 0개면 부모에서 아예 렌더하지 않음.
function ConditionDetailRow({ detail }: { detail: ConditionDetail }) {
  const [open, setOpen] = useState(false);
  const groups = flattenChecked(detail);
  const totalCount = groups.reduce((acc, g) => acc + g.items.length, 0);
  return (
    <Box sx={{ py: 0.5 }}>
      <Stack
        direction="row"
        alignItems="center"
        onClick={() => setOpen((v) => !v)}
        sx={{
          cursor: "pointer",
          gap: 0.5,
          py: 0.25,
          color: palette.primary,
          "&:hover": { opacity: 0.85 },
        }}
      >
        <RuleRoundedIcon sx={{ fontSize: 15 }} />
        <Typography sx={{ fontSize: 12.5, fontWeight: 700, letterSpacing: "-0.01em" }}>
          상태 상세 보기 ({totalCount})
        </Typography>
        {open ? (
          <ExpandLessRoundedIcon sx={{ fontSize: 16 }} />
        ) : (
          <ExpandMoreRoundedIcon sx={{ fontSize: 16 }} />
        )}
      </Stack>
      {open && (
        <Box
          sx={{
            mt: 0.75,
            p: 1.25,
            borderRadius: 2,
            background: palette.surfaceAlt,
            border: `1px solid ${palette.lineSoft}`,
          }}
        >
          <Stack gap={0.85}>
            {groups.map((g) => (
              <Box key={g.category}>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: palette.inkSubtle,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    mb: 0.4,
                  }}
                >
                  {g.category}
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {g.items.map((label) => (
                    <Box
                      key={label}
                      sx={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: palette.warn,
                        background: palette.warnSoft,
                        borderRadius: 999,
                        px: 0.85,
                        py: 0.25,
                      }}
                    >
                      {label}
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}
          </Stack>
          <Typography sx={{ fontSize: 11, color: palette.inkSubtle, mt: 1 }}>
            판매자가 등록 시 체크한 항목이에요.
          </Typography>
        </Box>
      )}
    </Box>
  );
}

// 도서 상세의 판매자 영역 — 프로필 + 거래수/별점/매너온도 + 받은 후기 미리보기 2개.
// 도서 상세 본문 안에서 useReceivedReviews 를 직접 호출하면 book 가드(early return)
// 와 훅 호출 순서가 꼬일 수 있어 별도 컴포넌트로 분리했다 (book 이 있을 때만 렌더됨).
function SellerCard({
  sellerName,
  sellerId,
  sellerRating,
  sellerTradeCount,
  sellerAvatar,
  loc,
  isMine,
}: {
  sellerName: string;
  sellerId?: string;
  sellerRating?: number;
  sellerTradeCount?: number;
  sellerAvatar?: string;
  loc: string;
  isMine: boolean;
}) {
  // 본인 책이면 후기 미리보기 호출을 스킵 — 본인 화면에서는 '받은 후기' 가 의미 없고,
  // 마이페이지 > 받은 후기 메뉴를 따로 쓰는 게 자연스럽다.
  // 받은 후기는 BookCard 위에 보조 정보로만 들어가는 거라 limit 2 로 충분.
  // mock 모드에서는 sellerId 가 보통 비어 있어 sellerName 을 revieweeId 매칭에 사용한다.
  const reviewLookupKey = isMine ? undefined : sellerId ?? sellerName;
  const { data: reviews } = useReceivedReviews(reviewLookupKey, 2);
  const showReviews = !isMine && (reviews?.length ?? 0) > 0;
  // 매너온도 — calcMannerTemperature 단일 헬퍼 사용. /mypage 본인 카드와 동일 공식.
  // 거래 횟수와 평균 별점 둘 다 가산 — 셀러 카드는 두 값을 join 으로 모두 갖고 있다.
  const manner = calcMannerTemperature(sellerTradeCount, sellerRating);

  return (
    <>
      <Stack direction="row" gap={1.25} alignItems="center">
        {/* 판매자 아바타 — profiles.avatar_url 이 있으면 실사진, 없으면 BookImage seed placeholder */}
        {sellerAvatar ? (
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              overflow: "hidden",
              flexShrink: 0,
              background: palette.surfaceAlt,
            }}
          >
            <Box
              component="img"
              src={sellerAvatar}
              alt=""
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </Box>
        ) : (
          <BookImage
            seed={sellerName}
            width={44}
            height={44}
            radius={999}
            theaterBackdrop={false}
          />
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {sellerName}
          </Typography>
          <Stack
            direction="row"
            alignItems="center"
            gap={0.25}
            sx={{ color: palette.inkSubtle, fontSize: 11.5, mt: 0.25 }}
          >
            <LocationOnRoundedIcon sx={{ fontSize: 13 }} />
            <span>{loc}</span>
            {sellerTradeCount != null && (
              <>
                <span style={{ margin: "0 4px" }}>·</span>
                <span>거래 {sellerTradeCount}회</span>
              </>
            )}
            {sellerRating != null && sellerRating > 0 && (
              <Stack direction="row" gap={0.15} alignItems="center" sx={{ ml: 0.25 }}>
                <StarRoundedIcon sx={{ fontSize: 13, color: "#FFC53D" }} />
                <span>{sellerRating.toFixed(1)}</span>
              </Stack>
            )}
          </Stack>
        </Box>
        <MannerTemperature value={manner} size="sm" />
      </Stack>

      {showReviews && (
        <Box sx={{ mt: 1.25, pt: 1.25, borderTop: `1px dashed ${palette.lineSoft}` }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.75}>
            <Typography
              sx={{
                fontSize: 11.5,
                fontWeight: 700,
                color: palette.inkSubtle,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              구매자가 남긴 후기
            </Typography>
            {sellerTradeCount != null && sellerTradeCount > 0 && (
              <Stack direction="row" alignItems="center" gap={0.25} sx={{ color: palette.inkSubtle }}>
                <Typography sx={{ fontSize: 11 }}>전체 보기</Typography>
                <KeyboardArrowRightRoundedIcon sx={{ fontSize: 14 }} />
              </Stack>
            )}
          </Stack>
          <Stack gap={0.75}>
            {(reviews ?? []).map((r) => (
              <ReviewPreviewRow key={r.id} review={r} />
            ))}
          </Stack>
        </Box>
      )}
    </>
  );
}

function ReviewPreviewRow({
  review,
}: {
  review: {
    id: string;
    rating: number;
    comment?: string;
    tags?: string[];
    reviewerName: string;
  };
}) {
  // 코멘트 없으면 첫 태그를 대신 노출 (둘 다 없으면 별점만)
  const fallback = review.tags?.[0];
  const text = review.comment?.trim() || fallback;
  return (
    <Box
      sx={{
        background: palette.surface,
        borderRadius: `${radius.sm}px`,
        border: `1px solid ${palette.lineSoft}`,
        p: 1,
      }}
    >
      <Stack direction="row" gap={0.5} alignItems="center" sx={{ mb: 0.25 }}>
        <Stack direction="row" gap={0.1}>
          {[1, 2, 3, 4, 5].map((i) => (
            <StarRoundedIcon
              key={i}
              sx={{
                fontSize: 12,
                color: i <= review.rating ? "#FFC53D" : palette.lineSoft,
              }}
            />
          ))}
        </Stack>
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 700,
            color: palette.inkMute,
          }}
        >
          {review.reviewerName}
        </Typography>
      </Stack>
      {text && (
        <Typography
          sx={{
            fontSize: 12.5,
            color: palette.ink,
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {text}
        </Typography>
      )}
    </Box>
  );
}
