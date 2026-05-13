"use client";

// 홈 화면 (/home) — 앱의 메인 피드
// 구성: 위치/검색바 → 이벤트 배너(가로 스크롤 2장) → 내 책장 바로가기 → 카테고리 → 최근 등록 책 → 추천 카테고리

import {
  Box,
  IconButton,
  Stack,
  Typography,
  Badge,
} from "@mui/material";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SearchPill from "@/components/ui/SearchPill";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import CardGiftcardRoundedIcon from "@mui/icons-material/CardGiftcardRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRef, useState } from "react";
import BottomTabNav from "@/components/ui/BottomTabNav";
import LocationChip from "@/components/ui/LocationChip";
import RegionPickerSheet from "@/components/ui/RegionPickerSheet";
import { BookFeedItem } from "@/components/ui/BookCard";
import BookImage from "@/components/ui/BookImage";
import { SectionLabel, ScrollBody } from "@/components/ui/Section";
import EmptyState from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import { palette, radius, shadow } from "@/lib/theme";
import { meta } from "@/lib/repo";
import { useRecentBooks, useSearchBooks } from "@/lib/query/bookHooks";
import { useMyProfile } from "@/lib/query/profileHooks";
import { useNotificationsStore } from "@/lib/store/notificationsStore";
import { useMyShelf } from "@/lib/query/shelfHooks";
import { useShelfStore } from "@/lib/store/shelfStore";
import { useRegionStore } from "@/lib/store/regionStore";
import { SHELF_STATUS_LABEL } from "@/lib/supabase/types";
import StatusBadge from "@/components/ui/StatusBadge";
import type { BookSummary } from "@/components/ui/BookCard";

const { CATEGORIES } = meta;

export default function HomePage() {
  const router = useRouter();
  const toast = useToast();
  // 사용자가 선택한 동네 — 헤더 칩 라벨 + 섹션 헤더 라벨 + 피드 정렬 우선순위에 모두 적용 (v9.8)
  const region = useRegionStore((s) => s.region);
  const [regionPickerOpen, setRegionPickerOpen] = useState(false);
  // 이벤트 배너 — 가로 스크롤 위치 추적 + 데스크톱용 점 인디케이터 클릭 이동
  const BANNER_COUNT = 2;
  const bannerScrollRef = useRef<HTMLDivElement>(null);
  const [activeBanner, setActiveBanner] = useState(0);
  const handleBannerScroll = () => {
    const el = bannerScrollRef.current;
    if (!el) return;
    // 카드 너비 ≈ scrollWidth/N. 절반 이상 넘어가면 다음 인덱스로 간주 (단순 round)
    const cardSpan = el.scrollWidth / BANNER_COUNT;
    const idx = Math.min(BANNER_COUNT - 1, Math.round(el.scrollLeft / cardSpan));
    if (idx !== activeBanner) setActiveBanner(idx);
  };
  const scrollToBanner = (idx: number) => {
    const el = bannerScrollRef.current;
    if (!el) return;
    const target = el.children[idx] as HTMLElement | undefined;
    if (!target) return;
    // scrollPaddingLeft(16) 만큼 빼야 snap 위치와 일치
    el.scrollTo({ left: target.offsetLeft - 16, behavior: "smooth" });
  };
  // React Query — region 우선 정렬. region 이 바뀌면 새로 fetch (캐시 키에 region 포함)
  const { data: books, isLoading } = useRecentBooks(10, region);
  // 추천 카테고리 — preferred_genres(가입 시 선택한 장르) 가 있으면 첫 번째,
  // 없으면 모든 사용자에게 노출되는 기본값 "소설".
  // /signup 에서 받은 preferred_genres 가 회원에게 자연스러운 발견 경험을 만든다.
  const { data: profile } = useMyProfile();
  const recommendCategory = profile?.preferred_genres?.[0] ?? "소설";
  const isMyTaste = !!profile?.preferred_genres?.length;
  const { data: categoryBooks } = useSearchBooks({ category: recommendCategory });
  // 알림 unread 개수 — 0 이면 헤더의 빨간점을 숨긴다
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  // 책장 카운트 — 홈 바로가기 카드에 권수/상태별 요약 노출
  // useMyShelf 가 결과를 받아 shelfStore 에 카운트를 동기화하므로 여기서 직접 데이터는 안 씀
  useMyShelf();
  const shelfTotal = useShelfStore((s) => s.total);
  const shelfByStatus = useShelfStore((s) => s.byStatus);

  return (
    <>
      <Box
        sx={{
          background: `linear-gradient(180deg, ${palette.surface} 0%, ${palette.surface}F2 100%)`,
          backdropFilter: "saturate(160%) blur(8px)",
          WebkitBackdropFilter: "saturate(160%) blur(8px)",
          borderBottom: `1px solid ${palette.lineSoft}`,
          px: 2,
          pt: 1.5,
          pb: 1.5,
          flexShrink: 0,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.25}>
          <LocationChip label={region} onClick={() => setRegionPickerOpen(true)} />
          <Stack direction="row">
            <IconButton onClick={() => router.push("/search")}>
              <SearchRoundedIcon />
            </IconButton>
            <IconButton onClick={() => router.push("/notifications")}>
              <Badge
                color="error"
                variant="dot"
                overlap="circular"
                invisible={unreadCount === 0}
              >
                <NotificationsNoneRoundedIcon />
              </Badge>
            </IconButton>
          </Stack>
        </Stack>
        {/* 입력은 받지 않고(readOnly), 클릭만으로 검색 페이지로 이동시키는 패턴 */}
        <SearchPill
          placeholder="찾고 있는 책이 있나요?"
          onClick={() => router.push("/search")}
          readOnly
          sx={{
            cursor: "pointer",
            "& input": { cursor: "pointer" },
          }}
        />
      </Box>

      <ScrollBody>
        {/* 이벤트 배너 — 좌우 스크롤 2장 (신규가입 쿠폰 안내 / 스타벅스 쿠폰 추첨 준비)
            scrollSnapType: "x mandatory" 로 한 장씩 스냅. 다음 카드가 ~30px 살짝 비쳐 스크롤 가능 힌트
            py 로 호버 lift(translateY -2px) + shadow 가 위에서 잘리지 않게 여유 확보 */}
        <Box
          ref={bannerScrollRef}
          onScroll={handleBannerScroll}
          className="no-scrollbar"
          sx={{
            mt: 1.5,
            display: "flex",
            gap: 1.25,
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            px: 2,
            py: 0.75,
            // 스냅 카드의 좌우 padding 보정 — 첫/마지막 카드 가장자리에 살짝 여유
            scrollPaddingLeft: 16,
            scrollPaddingRight: 16,
          }}
        >
          {/* 1) 신규가입 쿠폰 — 클릭 시 쿠폰함 (/mypage/coupons).
              perf: Link 로 변경 — 배너가 viewport 에 들어오는 시점에 /mypage/coupons 청크 prefetch.
              자식 Typography 에 color: inherit 강제 — globals.css 의 `a { color: inherit }` 와
              MUI Typography 의 기본 색 (text.primary = 검정) 이 만나 흰 배경에 검정 글씨로
              떨어지던 회귀 (Link 화 이후) 를 잡는다. */}
          <Box
            component={Link}
            href="/mypage/coupons"
            className="card-lift"
            sx={{
              flex: "0 0 86%",
              scrollSnapAlign: "start",
              borderRadius: `${radius.lg}px`,
              background: `linear-gradient(135deg, ${palette.accent} 0%, ${palette.accentDark} 70%, #8C3F33 100%)`,
              color: "#fff",
              p: 2.5,
              overflow: "hidden",
              position: "relative",
              cursor: "pointer",
              boxShadow: shadow.pop,
              minHeight: 140,
              textDecoration: "none",
              display: "block",
              "& .MuiTypography-root": { color: "inherit" },
            }}
          >
            {/* 우측 추상 데코 — 쿠폰 티켓 느낌의 큰 라운드 + 점선 원형 */}
            <Box
              sx={{
                position: "absolute",
                right: -50,
                top: -40,
                width: 200,
                height: 200,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.05) 60%, transparent 70%)",
                filter: "blur(2px)",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                right: 24,
                bottom: -28,
                width: 96,
                height: 96,
                borderRadius: "50%",
                border: "1.5px dashed rgba(255,255,255,0.30)",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                right: 80,
                top: 36,
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.10)",
              }}
            />

            <Box sx={{ position: "relative", zIndex: 1, maxWidth: "72%" }}>
              <Stack direction="row" alignItems="center" gap={0.75} mb={1}>
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                    background: "rgba(255,255,255,0.18)",
                    border: "1px solid rgba(255,255,255,0.28)",
                    backdropFilter: "blur(6px)",
                    borderRadius: 999,
                    px: 1,
                    py: 0.4,
                  }}
                >
                  <CardGiftcardRoundedIcon sx={{ fontSize: 13 }} />
                  <Typography
                    sx={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      letterSpacing: "0.18em",
                    }}
                  >
                    WELCOME
                  </Typography>
                </Box>
              </Stack>
              <Typography
                sx={{
                  fontSize: 18,
                  fontWeight: 800,
                  lineHeight: 1.4,
                  letterSpacing: "-0.025em",
                }}
              >
                신규가입 환영 쿠폰
                <br />
                받아가세요!
              </Typography>
              <Stack
                direction="row"
                gap={0.5}
                alignItems="center"
                sx={{ mt: 1.5, fontSize: 12.5, opacity: 0.95, fontWeight: 700 }}
              >
                쿠폰함에서 확인
                <ArrowForwardRoundedIcon sx={{ fontSize: 14 }} />
              </Stack>
            </Box>
          </Box>

          {/* 2) 스타벅스 쿠폰 추첨 — 준비 중 토스트 (기존 그대로) */}
          <Box
            onClick={() => toast?.show("이벤트 페이지는 준비 중이에요")}
            className="card-lift"
            sx={{
              flex: "0 0 86%",
              scrollSnapAlign: "start",
              borderRadius: `${radius.lg}px`,
              background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.primaryDark} 60%, #14302A 100%)`,
              color: "#fff",
              p: 2.5,
              overflow: "hidden",
              position: "relative",
              cursor: "pointer",
              boxShadow: shadow.pop,
              minHeight: 140,
            }}
          >
            <Box
              sx={{
                position: "absolute",
                right: -40,
                top: -30,
                width: 200,
                height: 200,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 60%, transparent 70%)",
                filter: "blur(2px)",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                right: 18,
                bottom: -30,
                width: 110,
                height: 110,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.20)",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                right: 60,
                top: 30,
                width: 50,
                height: 50,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.16)",
              }}
            />

            <Box sx={{ position: "relative", zIndex: 1, maxWidth: "70%" }}>
              <Stack direction="row" alignItems="center" gap={0.75} mb={1}>
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                    background: "rgba(255,255,255,0.16)",
                    border: "1px solid rgba(255,255,255,0.22)",
                    backdropFilter: "blur(6px)",
                    borderRadius: 999,
                    px: 1,
                    py: 0.4,
                  }}
                >
                  <CampaignRoundedIcon sx={{ fontSize: 13 }} />
                  <Typography
                    sx={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      letterSpacing: "0.18em",
                    }}
                  >
                    EVENT
                  </Typography>
                </Box>
              </Stack>
              <Typography
                sx={{
                  fontSize: 18,
                  fontWeight: 800,
                  lineHeight: 1.4,
                  letterSpacing: "-0.025em",
                }}
              >
                내 책장 정리하면
                <br />
                스타벅스 쿠폰 추첨!
              </Typography>
              <Stack
                direction="row"
                gap={0.5}
                alignItems="center"
                sx={{ mt: 1.5, fontSize: 12.5, opacity: 0.92, fontWeight: 700 }}
              >
                참여하기 (준비 중)
                <ArrowForwardRoundedIcon sx={{ fontSize: 14 }} />
              </Stack>
            </Box>
          </Box>
        </Box>

        {/* 배너 위치 인디케이터 — 데스크톱은 스와이프 어려워 점 클릭으로도 이동 가능 */}
        <Stack
          direction="row"
          gap={0.75}
          justifyContent="center"
          sx={{ mt: 1, mb: 0.5 }}
        >
          {Array.from({ length: BANNER_COUNT }).map((_, i) => {
            const on = i === activeBanner;
            return (
              <Box
                key={i}
                role="button"
                aria-label={`배너 ${i + 1}로 이동`}
                onClick={() => scrollToBanner(i)}
                sx={{
                  width: on ? 18 : 6,
                  height: 6,
                  borderRadius: 999,
                  background: on ? palette.primary : palette.line,
                  opacity: on ? 0.85 : 0.45,
                  cursor: "pointer",
                  transition: "width 200ms ease, opacity 160ms ease, background 160ms ease",
                  "&:hover": { opacity: on ? 0.95 : 0.7 },
                }}
              />
            );
          })}
        </Stack>

        {/* 내 책장 바로가기 — 이벤트 배너 바로 아래, 카테고리 위에 배치.
            perf: Link 화로 viewport 진입 시 /mypage/shelf 청크 prefetch. */}
        <Box
          component={Link}
          href="/mypage/shelf"
          className="card-lift"
          sx={{
            mx: 2,
            mt: 2,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            background: `linear-gradient(135deg, ${palette.surface} 0%, ${palette.surfaceAlt} 100%)`,
            border: `1px solid ${palette.lineSoft}`,
            borderRadius: `${radius.lg}px`,
            p: 1.75,
            cursor: "pointer",
            position: "relative",
            overflow: "hidden",
            boxShadow: shadow.card,
            textDecoration: "none",
            color: "inherit",
            "&:hover": {
              borderColor: palette.line,
              boxShadow: shadow.cardHover,
            },
          }}
        >
          {/* 미니 책등 데코 — 3장이 살짝 겹친 모양 */}
          <Box
            sx={{
              flexShrink: 0,
              position: "relative",
              width: 64,
              height: 56,
              display: "flex",
              alignItems: "flex-end",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                left: 4,
                bottom: 0,
                width: 16,
                height: 50,
                borderRadius: 1,
                background: `linear-gradient(180deg, ${palette.primary} 0%, ${palette.primaryDark} 100%)`,
                transform: "rotate(-4deg)",
                transformOrigin: "bottom",
                boxShadow: shadow.card,
              }}
            />
            <Box
              sx={{
                position: "absolute",
                left: 22,
                bottom: 0,
                width: 18,
                height: 56,
                borderRadius: 1,
                background: `linear-gradient(180deg, ${palette.accent} 0%, ${palette.accentDark} 100%)`,
                boxShadow: shadow.card,
              }}
            />
            <Box
              sx={{
                position: "absolute",
                left: 42,
                bottom: 0,
                width: 16,
                height: 48,
                borderRadius: 1,
                background: `linear-gradient(180deg, ${palette.warn} 0%, #9B6B1F 100%)`,
                transform: "rotate(3deg)",
                transformOrigin: "bottom",
                boxShadow: shadow.card,
              }}
            />
            <Box
              sx={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: -2,
                height: 4,
                borderRadius: 999,
                background: "linear-gradient(180deg, #B59B6E 0%, #8C7350 100%)",
                opacity: 0.85,
              }}
            />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" gap={0.5}>
              <AutoStoriesRoundedIcon sx={{ fontSize: 16, color: palette.primary }} />
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 800,
                  letterSpacing: "-0.025em",
                }}
              >
                내 책장
              </Typography>
            </Stack>
            <Typography
              sx={{
                fontSize: 11.5,
                color: palette.inkSubtle,
                mt: 0.25,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {shelfTotal === 0
                ? "읽고 있는 책, 정리할 책을 한 곳에 모아보세요."
                : `총 ${shelfTotal}권 · 읽는 중 ${shelfByStatus.READING} · ${SHELF_STATUS_LABEL.FOR_SALE} ${shelfByStatus.FOR_SALE}`}
            </Typography>
          </Box>
          <Box
            sx={{
              flexShrink: 0,
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: palette.primaryTint,
              color: palette.primary,
              display: "grid",
              placeItems: "center",
            }}
          >
            <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />
          </Box>
        </Box>

        {/* 카테고리 행 — 크기 축소(58→46) + 위아래 간격 압축. 메인 피드로 빠르게 시선 이동. */}
        <Box sx={{ pt: 1.25 }}>
          <Box
            className="no-scrollbar"
            sx={{
              display: "flex",
              gap: 1.25,
              px: 2,
              overflowX: "auto",
              pt: 0.5,
              pb: 0.5,
            }}
          >
            {CATEGORIES.map((c) => (
              // perf: Link — 카테고리 8개가 viewport 에 들어오면 /search 청크 1회 prefetch.
              <Box
                key={c.name}
                component={Link}
                href={`/search?category=${encodeURIComponent(c.name)}`}
                sx={{
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.5,
                  width: 54,
                  cursor: "pointer",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${palette.primaryTint} 0%, ${palette.primarySoft} 100%)`,
                    border: `1px solid ${palette.lineSoft}`,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 20,
                    transition:
                      "transform 200ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 200ms ease",
                    "&:hover": {
                      transform: "translateY(-2px) scale(1.04)",
                      boxShadow: `0 8px 20px ${palette.primaryGlow}`,
                    },
                  }}
                >
                  {c.emoji}
                </Box>
                <Typography
                  sx={{
                    fontSize: 11,
                    color: palette.inkMute,
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {c.name}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <SectionLabel
          right={
            <Stack
              direction="row"
              alignItems="center"
              gap={0.5}
              sx={{
                px: 1,
                py: 0.4,
                borderRadius: 999,
                background: palette.accentSoft,
              }}
            >
              <LocalFireDepartmentRoundedIcon
                sx={{ fontSize: 13, color: palette.accent }}
              />
              <Typography
                sx={{
                  fontSize: 11,
                  color: palette.accent,
                  fontWeight: 800,
                  letterSpacing: "-0.01em",
                }}
              >
                실시간 인기
              </Typography>
            </Stack>
          }
        >
          {region}의 따끈한 책
        </SectionLabel>

        <Box sx={{ background: palette.surface }}>
          {/* 로딩 → 스켈레톤, 빈 결과 → EmptyState, 데이터 있음 → 카드 목록 */}
          {isLoading && <ListSkeleton count={4} />}
          {books && books.length === 0 && (
            <EmptyState
              icon="📚"
              title="아직 등록된 책이 없어요"
              description="첫 번째 판매자가 되어 우리 동네에 책을 나눠보세요."
              actionLabel="책 등록하기"
              onAction={() => router.push("/register")}
            />
          )}
          {books?.map((b) => (
            <BookFeedItem key={b.id} book={b} />
          ))}
        </Box>

        {/* 카테고리 추천 섹션 — preferred_genres 가 있으면 "내 취향에 맞는 책",
            없으면 기본 "소설" 추천. SOLD/HIDDEN/canceled 책은 searchBooks 가 자동 필터.
            가로 스크롤 형태로 두께를 줄여 메인 피드와 구분 (v9.8) */}
        {categoryBooks && categoryBooks.length > 0 && (
          <>
            <SectionLabel
              right={
                <Box
                  onClick={() =>
                    router.push(
                      `/search?category=${encodeURIComponent(recommendCategory)}`
                    )
                  }
                  sx={{
                    px: 1.25,
                    py: 0.4,
                    borderRadius: 999,
                    background: palette.primaryTint,
                    color: palette.primary,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "-0.01em",
                    cursor: "pointer",
                    "&:hover": { background: palette.primarySoft },
                  }}
                >
                  더 보기 →
                </Box>
              }
            >
              {isMyTaste
                ? `취향에 맞을 ${recommendCategory} 책`
                : `${recommendCategory} 책 둘러보기`}
            </SectionLabel>
            <Box
              className="no-scrollbar"
              sx={{
                display: "flex",
                gap: 1.25,
                px: 2,
                // 호버 lift(-2px) + shadow 가 위에서 잘리지 않도록 세로 padding 확보
                pt: 0.75,
                pb: 1.5,
                overflowX: "auto",
              }}
            >
              {categoryBooks.slice(0, 8).map((b) => (
                <MiniBookCard
                  key={b.id}
                  book={b}
                  onClick={() => router.push(`/books/${b.id}`)}
                />
              ))}
            </Box>
          </>
        )}

        <Box sx={{ pb: 3 }} />
      </ScrollBody>

      <BottomTabNav />
      <RegionPickerSheet
        open={regionPickerOpen}
        onClose={() => setRegionPickerOpen(false)}
      />
    </>
  );
}

// 홈 카테고리 추천 섹션의 가로 스크롤 카드 (v9.8).
// 메인 피드(BookFeedItem) 보다 좁고 표지를 강조 — 발견 경험에 적합한 폼.
// 같은 책을 메인 피드에서 이미 봤을 수 있으니 "둘러보기" 톤으로 가벼운 인상.
function MiniBookCard({
  book,
  onClick,
}: {
  book: BookSummary;
  onClick: () => void;
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        flexShrink: 0,
        // 셀 폭은 표준 책 너비(2:3 of 170 = 113) 보다 살짝 여유. 표지는 안에서 중앙정렬.
        width: 124,
        cursor: "pointer",
        transition: "transform 200ms cubic-bezier(0.22, 1, 0.36, 1)",
        "&:hover": { transform: "translateY(-2px)" },
      }}
    >
      <Box
        sx={{
          position: "relative",
          mb: 0.75,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <BookImage
          seed={book.id}
          src={book.coverUrl}
          height={170}
          radius={0}
          autoWidth
        />
        {(book.status === "sold" ||
          book.status === "reserved" ||
          book.status === "free") && (
          <Box sx={{ position: "absolute", top: 8, left: 8 }}>
            <StatusBadge status={book.status as any} size="sm" />
          </Box>
        )}
      </Box>
      <Typography
        sx={{
          fontSize: 12.5,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          lineHeight: 1.35,
          // 항상 2줄 분량 공간 확보 — 짧은 제목 카드도 2줄짜리 카드와 같은 높이로 정렬.
          // (lineHeight 1.35 × 2 = 2.7em). 긴 제목은 line-clamp 로 잘림.
          minHeight: "2.7em",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {book.title}
      </Typography>
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 800,
          color: book.free ? palette.accent : palette.ink,
          mt: 0.4,
          letterSpacing: "-0.02em",
        }}
      >
        {book.price}
      </Typography>
      <Typography sx={{ fontSize: 10.5, color: palette.inkSubtle, mt: 0.1 }}>
        {book.loc ?? "-"}
      </Typography>
    </Box>
  );
}
